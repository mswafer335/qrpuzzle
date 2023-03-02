import { Response, Request, Router } from "express";
const router = Router();
// import { check, validationResult } from "express-validator";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });
import auth from "../middleware/auth";

import axios from "axios";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import fs from "fs";
import archiver from "archiver";
import path from "path";
import nodemailer from "nodemailer";
import imageToBase64 from "image-to-base64";
import { fonts } from "../public/fonts/sans";
import Prize, { IPrize } from "../models/Prize";
import QR, { IQR } from "../models/QR-urls";
import Bundle from "../models/Bundle";
import Player from "../models/Player";
import stat from "../middleware/stats";

const QRConfig = [
  {
    font:"sans",
    size: 18,
    y:189,
    color: "#FAD620",
    instructionName: "0001.jpg",
    margin: 5,
    fill: "FD"
  },
  {
    font:"Anton-Regular",
    size: 20,
    y: 284,
    color: "#F20115",
    instructionName: "sideNew1.jpg",
    margin: 6,
    fill: "S"
  },
]

const canvasSize = [450, 320];

function makeid(length: number) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host:"smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_PASSWORD,
  },
  logger: true,
  debug: true,
});

function regexEscape(str: string) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

// check QR
router.get("/qr/:qr", async (req: Request, res: Response) => {
  try {
    const qr = await QR.findOne({ code: req.params.qr }).populate({
      path: "prize",
      populate: { path: "player" },
    });
    if (!qr) {
      return res
        .status(404)
        .json({ err: "Указанный QR код не найден", approve: false });
    }
    if(qr.prize && qr.prize.payed){
      return res.status(400).json({err:"Этот код уже был использован"})
    }
    if (qr.validated === true && qr.prize && qr.prize.payed) {
      return res
        .status(400)
        .json({ err: "Этот код уже был использован", approve: false });
    }
    const date = new Date();
    if (
      qr.prize &&
      qr.prize.ActivationDate &&
      Number(date) - Number(qr.prize.ActivationDate) > (1000 * 60 * 60 * 24 * 7)
    ) {
      return res
        .status(400)
        .json({ err: "Истек срок годности кода", dateInvalid: true });
    }
    if (
      qr.validated === true &&
      qr.prize &&
      qr.prize.player &&
      !qr.prize.payed
    ) {
      const response: any = {
        value: qr.prize.value,
        msg: "Введите номер телефона для пополнения счета",
          // qr.prize.value <= 50
          //   ? "Введите номер телефона для пополнения счета"
          //   : "Введите номер карты для перевода денег",
        approve: true,
        code: qr.prize.code,
        phone: true,
        totalSum:
          qr.prize.player.prize_sum > 4000
            ? qr.prize.player.prize_sum
            : undefined,
        count: qr.prize.player.prizes_activated,
      };

      return res.status(200).json(response);
    }
    if (qr.validated && qr.prize) {
      return res.status(200).json({
        msg: "Введите номер, имя и тд",
        approve: true,
        status: 302,
        code: qr.prize.code,
        value: qr.prize.value,
      });
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
    const qr = await QR.findOne({ code: req.params.qr });
    const prize = await Prize.findOne({ code: req.body.code.toLowerCase() });
    if (!prize || !qr) {
      return res
        .status(400)
        .json({ err: "Неверный код валидации", status: false });
    }
    if (prize.player) {
      return res.status(404).json({
        err: "Указанный валидационный код уже привязан к пользователю",
        status: false,
      });
    }
    if (prize.validated === true) {
      return res.status(404).json({
        err: "Указанный валидационный код уже использован",
        status: false,
      });
    }
    prize.qr = qr._id;
    prize.validated = true;
    prize.ActivationDate = new Date();
    qr.validated = true;
    qr.prize = prize._id;
    await prize.save();
    // console.log(prize.ActivationDate, prize.code);
    await qr.save();
    // await Prize.findOneAndUpdate(
    //   { code: req.body.code.toLowerCase() },
    //   { qr: qr._id, validated: true, ActivationDate: new Date() }
    // );
    await Bundle.findOneAndUpdate(
      { prizes: prize._id },
      { $inc: { amount_validated: 1 } }
    );
    await stat({
      $inc: { PrizesActivated: 1, TotalWinnings: prize.value },
      // TotalWinnings: { $inc: prize.value },
    });
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
    if (!code) {
      return res.status(400).json({ err: "Код невалиден" });
    }
    if (code.player) {
      return res
        .status(400)
        .json({ err: "Код уже был привязан к пользователю" });
    }
    const date = new Date();
    if (Number(date) - Number(code.ActivationDate) > 604800000) {
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
      await stat({ $inc: { $newUsers: 1 } });
    }
    user.prizes_activated += 1;
    user.prizes.push(code);
    user.prize_sum += code.value;
    user.change_date = new Date();
    let response: any = { value: code.value, count: user.prizes_activated };
    if (user.prize_sum <= 4000) {
      user.sum_ndfl = user.prize_sum;
      // response.msg = "Введите номер карты для перевода денег";
      // if (code.value <= 50) {
      response.msg =
        "Введите номер телефона на счет которого перевести деньги";
      // }
      await stat({
        $inc: { PrizesClaimed: 1, WinningsClaimed: code.value },
      });
    } else {
      const num = user.prize_sum - 4000;
      const tax = num * 0.35;
      user.sum_ndfl = user.prize_sum - tax;
      user.tax_sum = tax;
      response = { value: code.value };
      response.msg = "Пользователь привязан, уведомление о НДФЛ отправлено";
      response.totalSum = user.prize_sum;
      // send email
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: process.env.RECEIVER_EMAIL,
        subject: `<no-reply> Выигрыш больше 4000 рублей`,
        text: `Пользователь ${user.fullname}(email:${user.email}, телефон:${user.phone}}) активировал код на ${code.value} рублей, теперь сумма его выигрыша с учетом налогов составляет ${user.sum_ndfl}, размер налога составляет ${user.tax_sum} рублей`,
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) throw err;
        console.log(info.response);
      });
    }
    await user.save();
    code.player = user;
    await code.save();
    res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// change payment status
router.put("/pay/:id", auth, async (req: Request, res: Response) => {
  try {
    const user = await Player.findOne({ _id: req.params.id });
    if (!user) {
      return res.status(404).json({ err: "Код не найден" });
    }
    user.change_date = new Date();
    await user.save();
    await Prize.updateMany({ _id: { $in: user.prizes } }, { payed: true });
    res.redirect(303, "/users/find/all/ndfl");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get all claimed prizes
router.get("/find/claimed", auth, async (req: Request, res: Response) => {
  try {
    console.log(req.query);
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
      if (key !== "fullname" && key !== "phone" && key !== "email") {
        PRIZE_QUERY[key] = req.query[key];
      }
    }
    let codes = await Prize.find(PRIZE_QUERY).populate("player");
    if (req.query.fullname) {
      // @ts-ignore:
      const regex = new RegExp(regexEscape(req.query.fullname));
      codes = codes.filter((el) => {
        return el.player && regex.test(el.player.fullname);
      });
    }
    if (req.query.phone) {
      // @ts-ignore:
      const regex = new RegExp(regexEscape(req.query.phone));
      codes = codes.filter((el) => {
        return el.player && regex.test(el.player.phone);
      });
    }
    if (req.query.email) {
      // @ts-ignore:
      const regex = new RegExp(regexEscape(req.query.email));
      codes = codes.filter((el) => {
        return el.player && regex.test(el.player.email);
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
      .sort({ ActivationDate: -1 });
    if (req.query.fullname) {
      // @ts-ignore:
      const regex = new RegExp(regexEscape(req.query.fullname));
      codes = codes.filter((el) => {
        return el.player && regex.test(el.player.fullname);
      });
    }
    if (req.query.phone) {
      // @ts-ignore:
      const regex = new RegExp(regexEscape(req.query.phone));
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

/// gen chunk
router.post("/generatecodes",
auth,
 async (req: Request, res: Response) => {
  try {
    const QRNumber: number = req.body.count;
    const price: number = req.body.price;
    const type:number = req.body.type;
    if(type>=QRConfig.length) return res.status(400).json({err:"invalid type"});
    const selectedConfig = QRConfig[type];
    const {instructionName, font, size, y, color, margin, fill} = selectedConfig;
    let instruction: string;
    let bg: string;
    await imageToBase64(__dirname + `/../../${instructionName}`).then(
      (response) => (instruction = response)
    );
    if(type===1) {
      await imageToBase64(__dirname + "/../../bgNew.jpg").then(
        (response) => (bg = response)
      );
    }

    let date: any = new Date();
    date =
      date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate();
    let QRurl: string;

    const archName = `${date}-${price.toString()}-${QRNumber}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toLowerCase()}.zip`;
    const filenameArray: string[] = [];
    let output;
    try {
      output = fs.createWriteStream(
        path.normalize(__dirname + "/../public/archive/" + archName)
      );
    } catch (error) {
      console.error(error);
    }

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
      const file = path.normalize(__dirname + `/../public/pdf/${filename}`);
      console.log("pre");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: canvasSize,
      });
      const border = margin+10;
      while (a <= num) {
        const code1 = Math.random().toString(36).substr(3, 4).toLowerCase();
        const code2 = Math.random().toString(36).substr(3, 4).toLowerCase();
        const code3 = Math.random().toString(36).substr(3, 4).toLowerCase();
        const code4 = Date.now().toString(36).substr(4).toLowerCase();
        const CodeFinal = code1 + code2 + code3 + code4;
        let CodePrint = code1 + "-" + code2 + "-" + code3 + "-" + code4;
        const QR_CODE = makeid(7) + Date.now().toString(36).toUpperCase();
        const QRinput = process.env.win_url + QR_CODE;

        await QRCode.toDataURL(QRinput, {
          errorCorrectionLevel: "H",
          type: "image/png",
          margin: 0.5,
          color: {
            dark: "#000000",
            light: "#0000",
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
        doc.addFileToVFS(`${font}.ttf`, fonts[type]);
        doc.addFont(`${font}.ttf`, font, `normal`);
        doc.setFont(font);
        doc.setFillColor("#FAD620");
        if(bg) {
          doc.addImage(bg, "jpeg", margin, margin, canvasSize[1]-margin*2, canvasSize[1]-margin*2);
          CodePrint = CodePrint.toUpperCase();
        }
        // else {
        //     doc.rect(5, 5, 310, 310, "FD");
        // }
        doc.rect(margin, margin, canvasSize[1]-margin*2, canvasSize[1]-margin*2, fill);
        doc.setFontSize(size);
        doc.setTextColor(color);
        doc.addImage(QRurl, "png", border, border, canvasSize[1]-border*2, canvasSize[1]-border*2);
        doc.addImage(instruction, "jpeg", 315+margin, margin, 135-margin*2, 320-margin*2);
        // doc.addImage(mainQR, "jpeg", 343.8, 226.5, 77.4, 73.5);
        doc.text(CodePrint, 383, y, null, "center");
        doc.rect(315+margin, margin, 135-margin*2, 320-margin*2);
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
      const numerator = 250
      let ind = 0;
      let firstNum = 1;
      let numLeft = count;
      while (ind < count) {
        if (numLeft >= numerator) {
          ind += numerator;
          numLeft -= numerator;
          await createPDF(numerator, firstNum, ind);
          firstNum += numerator;
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
    const directory = path.normalize(__dirname + "/../public/pdf");
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
