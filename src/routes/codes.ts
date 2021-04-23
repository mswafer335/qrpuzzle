import { Response, Request, Router } from "express";
const router = Router();
// import { check, validationResult } from "express-validator";
import { callbackApi, asyncApi } from "node-qiwi-api";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });
import auth from "../middleware/auth";

const callbackWallet = new callbackApi(process.env.QIWI_TOKEN);
const asyncWallet = new asyncApi(process.env.QIWI_TOKEN);
import axios from "axios";
// import Prize from "../models/Prize";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import fs from "fs";
import archiver from "archiver";
import path from "path";
import nodemailer from "nodemailer";
// import sharp from "sharp";
import { font } from "../public/fonts/sans";
import Prize, { IPrize } from "../models/Prize";
import QR, { IQR } from "../models/QR-urls";
import Bundle from "../models/Bundle";
import Player from "../models/Player";

function makeid(length: number) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// test
router.post("/test", async (req, res) => {
  try {
    // const huy = await axios.post(
    //   `https://edge.qiwi.com/sinap/providers/${req.body.receiver}/onlineCommission`,
    //   {
    //     account: "79788287717",
    //     paymentMethod: { type: "Account", accountId: "643" },
    //     purchaseTotals: { total: { amount: req.body.sum, currency: "643" } },
    //   }
    // );
    // res.json(huy.data);
    res.json(
      await asyncWallet.checkOnlineCommission(req.body.receiver, {
        account: "",
        amount: req.body.sum,
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// check QR
router.get("/qr/:qr", async (req: Request, res: Response) => {
  try {
    const qr = await QR.findOne({ code: req.params.qr });
    if (!qr) {
      return res
        .status(404)
        .json({ err: "Указанный QR код не найден", approve: false });
    }
    if (qr.validated === true) {
      return res.status(400).json({ err: "Этот QR код уже был использован" });
    }
    return res
      .status(200)
      .json({ msg: "Введите валидационный код", approve: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get prize
router.put("/win/:qr", async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    const qr = await QR.findOne({ code: req.params.qr });
    const prize = await Prize.findOne({ code: req.body.code.toLowerCase() });
    if (!prize || !qr) {
      return res
        .status(400)
        .json({ err: "Неверный код валидации", status: false });
    }
    if (prize.validated === true) {
      return res.status(404).json({
        err: "Указанный валидационный код уже использован",
        status: false,
      });
    }
    prize.qr = qr._id;
    prize.validated = true;
    prize.activation_date = new Date();
    qr.validated = true;
    qr.prize = prize._id;
    await prize.save();
    await qr.save();
    await Bundle.findOneAndUpdate(
      { prizes: prize._id },
      { $inc: { amount_validated: 1 } }
    );
    return res.json({
      msg: `Вы выиграли ${prize.value} рублей!`,
      value: prize.value,
      status: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// claim prize
router.put("/claim", async (req: Request, res: Response) => {
  try {
    let user = await Player.findOne({ phone: req.body.phone });
    const code = await Prize.findOne({ code: req.body.code.toLowerCase() });
    if (!code || code.player) {
      return res.status(400).json({ err: "Код невалиден" });
    }
    const date = new Date();
    if (Number(date) - Number(code.activation_date) > 604800000) {
      return res.status(400).json({ err: "Истек срок годности кода" });
    }
    if (!user) {
      user = new Player({
        phone: req.body.phone,
        email: req.body.email,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        fullname: req.body.lastname + " " + req.body.firstname,
        prizes: [],
        prize_sum: 0,
      });
    }
    user.prizes.push(code);
    user.prize_sum += code.value;
    let msg: string;
    if (user.prize_sum <= 4000) {
      user.sum_ndfl = user.prize_sum;
      code.payed = true;
      msg = "Пользователь привязан, оплачено";
    } else {
      const num = user.prize_sum - 4000;
      const tax = num * 0.35;
      user.sum_ndfl = user.prize_sum - tax;
      user.tax_sum = tax;
      msg = "Пользователь привязан, уведомление о НДФЛ отправлено";
      // send email
      const transporter = nodemailer.createTransport({
        host: "smtp.yandex.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.SENDER_EMAIL,
          pass: process.env.SENDER_PASSWORD,
        },
      });
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: process.env.RECEIVER_EMAIL,
        subject: `<no-reply> Кто-то выиграл больше 4000 рублей`,
        text: `Пользователь ${user.fullname} активировал код на ${code.value} рублей, теперь сумма его выигрыша с учетом налогов составляет ${user.sum_ndfl}, размер налога составляет ${user.tax_sum} рублей`,
      };
      console.log("pre send")
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) throw err;
        console.log(info.response);
      });
    }
    await user.save();
    code.player = user;
    await code.save();
    res.json({ msg });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// change payment status
router.put("/pay/:id", async (req: Request, res: Response) => {
  try {
    const user = await Player.findOne({ _id: req.params.id });
    if (!user) {
      return res.status(404).json({ err: "Код не найден" });
    }
    await Prize.updateMany({ _id: { $in: user.prizes } }, { payed: true });
    return res.json({ msg: "Статус платежа изменен" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get all claimed prizes
router.get("/find/claimed", auth, async (req: Request, res: Response) => {
  try {
    const keys = Object.keys(req.query);
    const PRIZE_QUERY: any = {
      player: { $ne: undefined },
    };
    for (const key of keys) {
      if (req.query[key] === "true") {
        // @ts-ignore:
        req.query[key] = true;
      }
      if (req.query[key] === "false") {
        // @ts-ignore:
        req.query[key] = false;
      }
    }
    for (const key of keys) {
      if (key !== "fullname" && key !== "phone") {
        PRIZE_QUERY[key] = req.query[key];
      }
    }
    let codes = await Prize.find(PRIZE_QUERY).populate("player");
    if (req.query.fullname) {
      // @ts-ignore:
      const regex = new RegExp(req.query.fullname);
      codes = codes.filter((el) => {
        return el.player && regex.test(el.player.fullname);
      });
    }
    if (req.query.phone) {
      // @ts-ignore:
      const regex = new RegExp(req.query.phone);
      codes = codes.filter((el) => {
        return el.player && regex.test(el.player.phone);
      });
    }
    res.json(codes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get all validated codes
router.get("/find/validated", auth, async (req: Request, res: Response) => {
  try {
    const codes = await Prize.find({ validated: true }).populate("player");
    res.json(codes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get all codes
router.get("/find/all", auth, async (req: Request, res: Response) => {
  try {
    const keys = Object.keys(req.query);
    const PRIZE_QUERY: any = {};
    for (const key of keys) {
      if (req.query[key] === "true") {
        // @ts-ignore:
        req.query[key] = true;
      }
      if (req.query[key] === "false") {
        // @ts-ignore:
        req.query[key] = false;
      }
    }
    for (const key of keys) {
      if (key !== "fullname" && key !== "phone") {
        PRIZE_QUERY[key] = req.query[key];
      }
    }
    let codes = await Prize.find(PRIZE_QUERY)
      .populate("player")
      .sort({ activation_date: -1 });
    if (req.query.fullname) {
      // @ts-ignore:
      const regex = new RegExp(req.query.fullname);
      codes = codes.filter((el) => {
        return el.player && regex.test(el.player.fullname);
      });
    }
    if (req.query.phone) {
      // @ts-ignore:
      const regex = new RegExp(req.query.phone);
      codes = codes.filter((el) => {
        return el.player && regex.test(el.player.phone);
      });
    }
    res.json(codes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// generator
router.post("/genold", async (req: Request, res: Response) => {
  try {
    let date: any = new Date();
    date =
      date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate();
    let QRurl: string;
    const QRNumber: number = req.body.count;
    const price: number = req.body.price;
    const archName = `${date}-${price.toString()}-${QRNumber}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toLowerCase()}.zip`;
    const filenameArray: string[] = [];
    const output = fs.createWriteStream(
      __dirname + "/../public/archive/" + archName
    );
    const archive = archiver("zip", {
      zlib: { level: 6 },
    });
    archive.pipe(output);
    archive.on("error", (err) => {
      if (err) throw err;
    });
    const QR_ARRAY: IQR[] = [];
    const PRIZE_ARRAY: IPrize[] = [];
    const filename =
      Math.random().toString(36).substr(2, 6).toLowerCase() + ".pdf";
    const file = __dirname + `/../public/pdf/${filename}`;
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [450, 320],
      compress: false,
    });
    const func = async (count: number) => {
      let ind = 1;
      while (ind <= count) {
        const code1 = Math.random().toString(36).substr(3, 4).toLowerCase();
        const code2 = Math.random().toString(36).substr(3, 4).toLowerCase();
        const code3 = Math.random().toString(36).substr(3, 4).toLowerCase();
        const code4 = Date.now().toString(36).substr(4).toLowerCase();
        const CodeFinal = code1 + code2 + code3 + code4;
        const CodePrint = code1 + "-" + code2 + "-" + code3 + "-" + code4;
        const QR_CODE = makeid(7) + Date.now().toString(36).substring(5);
        const QRinput = process.env.win_url + QR_CODE;

        await QRCode.toDataURL(QRinput, {
          // errorCorrectionLevel: "H",
          type: "image/jpeg",
          // quality: 0.2,
          margin: 0.5,
          color: {
            dark: "#000000",
            light: "#ffdc00",
          },
        })
          .then((url) => {
            QRurl = url;
          })
          .catch((err) => {
            console.error(err);
          });
        if (ind > 1) {
          doc.addPage();
        }
        doc.addFileToVFS("sans.ttf", font);
        doc.addFont("sans.ttf", "sans", "normal");
        doc.setFont("sans");
        doc.setFillColor(0.02, 0.1, 1.0, 0.0);
        doc.rect(5, 5, 310, 310, "FD");
        doc.setFillColor(0.02, 0.1, 1.0, 0.0);
        doc.rect(320, 5, 125, 310, "FD");
        // doc.setLineWidth(2);
        // doc.rect(10, 10, 300, 300, "FD");
        doc.setFontSize(23);
        doc.text("Текст инструкции:", 335, 200);
        doc.text("Тут будет инструкция", 335, 220);
        doc.text("Валидационный код:", 335, 290);
        doc.text(CodePrint, 335, 300);
        doc.addImage(QRurl, "jpeg", 15, 15, 290, 290, "MEDIUM");
        ind += 1;
        const PrizeObj: IPrize = new Prize({
          code: CodeFinal,
          value: price,
          validated: false,
          date: Date.now(),
          qr: undefined,
        });
        const QRObj: IQR = new QR({ code: QR_CODE, url: QRinput });
        QR_ARRAY.push(QRObj);
        PRIZE_ARRAY.push(PrizeObj);
      }
    };
    console.log("pre creation");
    await func(QRNumber);
    // res.on("finish", async () => {
    // });
    console.log("post creation");
    doc.save(file);
    console.log("save");
    archive.file(file, { name: filename });
    console.log("post archive");
    filenameArray.push(filename);
    output.on("close", async () => {
      const NewBundle = new Bundle({
        amount: QRNumber,
        date: new Date(),
        value: price,
        archive_path: `archive/${archName}`,
        prizes: PRIZE_ARRAY,
        qrs: QR_ARRAY,
      });
      await NewBundle.save();
      await Prize.insertMany(PRIZE_ARRAY);
      await QR.insertMany(QR_ARRAY);
      res.json(
        NewBundle
        // path.resolve(__dirname + `/../public/archive/` + archName),
        // archName
      );
    });
    console.log("pre archive finalization");
    await archive.finalize();
    console.log("post archive finalization");
    const directory = __dirname + "/../public/pdf";
    console.log("deletion");
    for (const fuck of filenameArray) {
      fs.unlink(path.join(directory, fuck), (err) => {
        if (err) throw err;
      });
    }
    console.log(path.resolve(__dirname + `/../public/archive/` + archName));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

/// gen chunk
router.post("/generatecodes", async (req: Request, res: Response) => {
  try {
    let date: any = new Date();
    date =
      date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate();
    let QRurl: string;
    const QRNumber: number = req.body.count;
    const price: number = req.body.price;
    const archName = `${date}-${price.toString()}-${QRNumber}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toLowerCase()}.zip`;
    const filenameArray: string[] = [];
    const output = fs.createWriteStream(
      __dirname + "/../public/archive/" + archName
    );
    const archive = archiver("zip", {
      zlib: { level: 6 },
    });
    archive.pipe(output);
    archive.on("error", (err) => {
      if (err) throw err;
    });
    const QR_ARRAY: IQR[] = [];
    const PRIZE_ARRAY: IPrize[] = [];
    const createPDF = async (num: number, start: number, end: number) => {
      let a: number = 1;
      const filename = start + "-" + end + ".pdf";
      const file = __dirname + `/../public/pdf/${filename}`;
      console.log("pre");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [450, 320],
      });
      while (a <= num) {
        const code1 = Math.random().toString(36).substr(3, 4).toLowerCase();
        const code2 = Math.random().toString(36).substr(3, 4).toLowerCase();
        const code3 = Math.random().toString(36).substr(3, 4).toLowerCase();
        const code4 = Date.now().toString(36).substr(4).toLowerCase();
        const CodeFinal = code1 + code2 + code3 + code4;
        const CodePrint = code1 + "-" + code2 + "-" + code3 + "-" + code4;
        const QR_CODE = makeid(7) + Date.now().toString(36).substring(5);
        const QRinput = process.env.win_url + QR_CODE;

        await QRCode.toDataURL(QRinput, {
          errorCorrectionLevel: "H",
          type: "image/jpeg",
          // quality: 0.2,
          margin: 0.5,
          color: {
            dark: "#000000",
            light: "#ffdc00",
          },
        })
          .then((url) => {
            QRurl = url;
          })
          .catch((err) => {
            console.error(err);
          });
        if (a > 1) {
          doc.addPage();
        }
        doc.addFileToVFS("sans.ttf", font);
        doc.addFont("sans.ttf", "sans", "normal");
        doc.setFont("sans");
        doc.setFillColor(0.02, 0.1, 1.0, 0.0);
        doc.rect(5, 5, 310, 310, "FD");
        doc.setFillColor(0.02, 0.1, 1.0, 0.0);
        doc.rect(320, 5, 125, 310, "FD");
        // doc.setLineWidth(2);
        // doc.rect(10, 10, 300, 300, "FD");
        doc.setFontSize(23);
        doc.text("Текст инструкции:", 335, 200);
        doc.text("Тут будет инструкция", 335, 220);
        doc.text("Валидационный код:", 335, 290);
        doc.text(CodePrint, 335, 300);
        doc.addImage(QRurl, "jpeg", 15, 15, 290, 290);
        const PrizeObj: IPrize = new Prize({
          code: CodeFinal,
          value: price,
          validated: false,
          date: Date.now(),
          qr: undefined,
        });
        const QRObj: IQR = new QR({ code: QR_CODE, url: QRinput });
        QR_ARRAY.push(QRObj);
        PRIZE_ARRAY.push(PrizeObj);
        a += 1;
      }
      console.log("save");
      doc.save(file);
      archive.file(file, { name: filename });
      filenameArray.push(filename);
      console.log("next cycle");
    };
    const func = async (count: number) => {
      let ind = 0;
      let firstNum = 1;
      let numLeft = count;
      while (ind < count) {
        if (numLeft >= 1000) {
          ind += 1000;
          numLeft -= 1000;
          await createPDF(1000, firstNum, ind);
          firstNum += 1000;
        } else {
          ind += 1;
          await createPDF(numLeft, ind, count);
          break;
        }
      }
    };
    await func(QRNumber);
    output.on("close", async () => {
      const NewBundle = new Bundle({
        amount: QRNumber,
        date: new Date(),
        value: price,
        archive_path: `archive/${archName}`,
        prizes: PRIZE_ARRAY,
        qrs: QR_ARRAY,
      });
      await NewBundle.save();
      await Prize.insertMany(PRIZE_ARRAY);
      await QR.insertMany(QR_ARRAY);
      res.json(
        NewBundle
        // path.resolve(__dirname + `/../public/archive/` + archName),
        // archName
      );
    });
    await archive.finalize();
    const directory = __dirname + "/../public/pdf";
    for (const fuck of filenameArray) {
      fs.unlink(path.join(directory, fuck), (err) => {
        if (err) throw err;
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});
export default router;
