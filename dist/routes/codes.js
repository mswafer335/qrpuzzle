"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
// import { check, validationResult } from "express-validator";
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: __dirname + "/.env" });
const auth_1 = __importDefault(require("../middleware/auth"));
const jspdf_1 = require("jspdf");
const qrcode_1 = __importDefault(require("qrcode"));
const fs_1 = __importDefault(require("fs"));
const archiver_1 = __importDefault(require("archiver"));
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const image_to_base64_1 = __importDefault(require("image-to-base64"));
const sans_1 = require("../public/fonts/sans");
const Prize_1 = __importDefault(require("../models/Prize"));
const QR_urls_1 = __importDefault(require("../models/QR-urls"));
const Bundle_1 = __importDefault(require("../models/Bundle"));
const Player_1 = __importDefault(require("../models/Player"));
const stats_1 = __importDefault(require("../middleware/stats"));
const QRConfig = [
    {
        font: "sans",
        size: 18,
        y: 189,
        color: "#FAD620",
        instructionName: "0001.jpg",
        margin: 5,
        fill: "FD"
    },
    {
        font: "Anton-Regular",
        size: 20,
        y: 284,
        color: "#F20115",
        instructionName: "sideNew1.jpg",
        margin: 6,
        fill: "S"
    },
];
const canvasSize = [450, 320];
function makeid(length) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
const transporter = nodemailer_1.default.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
    },
    logger: true,
    debug: true,
});
function regexEscape(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
// check QR
router.get("/qr/:qr", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const qr = yield QR_urls_1.default.findOne({ code: req.params.qr }).populate({
            path: "prize",
            populate: { path: "player" },
        });
        if (!qr) {
            return res
                .status(404)
                .json({ err: "Указанный QR код не найден", approve: false });
        }
        if (qr.prize && qr.prize.payed) {
            return res.status(400).json({ err: "Этот код уже был использован" });
        }
        if (qr.validated === true && qr.prize && qr.prize.payed) {
            return res
                .status(400)
                .json({ err: "Этот код уже был использован", approve: false });
        }
        const date = new Date();
        if (qr.prize &&
            qr.prize.ActivationDate &&
            Number(date) - Number(qr.prize.ActivationDate) > (1000 * 60 * 60 * 24 * 7)) {
            return res
                .status(400)
                .json({ err: "Истек срок годности кода", dateInvalid: true });
        }
        if (qr.validated === true &&
            qr.prize &&
            qr.prize.player &&
            !qr.prize.payed) {
            const response = {
                value: qr.prize.value,
                msg: "Введите номер телефона для пополнения счета",
                // qr.prize.value <= 50
                //   ? "Введите номер телефона для пополнения счета"
                //   : "Введите номер карты для перевода денег",
                approve: true,
                code: qr.prize.code,
                phone: true,
                totalSum: qr.prize.player.prize_sum > 4000
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// get prize
router.put("/win/:qr", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const qr = yield QR_urls_1.default.findOne({ code: req.params.qr });
        const prize = yield Prize_1.default.findOne({ code: req.body.code.toLowerCase() });
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
        yield prize.save();
        // console.log(prize.ActivationDate, prize.code);
        yield qr.save();
        // await Prize.findOneAndUpdate(
        //   { code: req.body.code.toLowerCase() },
        //   { qr: qr._id, validated: true, ActivationDate: new Date() }
        // );
        yield Bundle_1.default.findOneAndUpdate({ prizes: prize._id }, { $inc: { amount_validated: 1 } });
        yield stats_1.default({
            $inc: { PrizesActivated: 1, TotalWinnings: prize.value },
            // TotalWinnings: { $inc: prize.value },
        });
        return res.json({
            msg: `Вы выиграли ${prize.value} рублей!`,
            value: prize.value,
            status: true,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// claim prize
router.put("/claim", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let user = yield Player_1.default.findOne({ phone: req.body.phone });
        const code = yield Prize_1.default.findOne({ code: req.body.code.toLowerCase() });
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
            user = new Player_1.default({
                phone: req.body.phone,
                email: req.body.email,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                fullname: req.body.lastname + " " + req.body.firstname,
                prizes: [],
                prize_sum: 0,
            });
            yield stats_1.default({ $inc: { $newUsers: 1 } });
        }
        user.prizes_activated += 1;
        user.prizes.push(code);
        user.prize_sum += code.value;
        user.change_date = new Date();
        let response = { value: code.value, count: user.prizes_activated };
        if (user.prize_sum <= 4000) {
            user.sum_ndfl = user.prize_sum;
            // response.msg = "Введите номер карты для перевода денег";
            // if (code.value <= 50) {
            response.msg =
                "Введите номер телефона на счет которого перевести деньги";
            // }
            yield stats_1.default({
                $inc: { PrizesClaimed: 1, WinningsClaimed: code.value },
            });
        }
        else {
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
                if (err)
                    throw err;
                console.log(info.response);
            });
        }
        yield user.save();
        code.player = user;
        yield code.save();
        res.json(response);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// change payment status
router.put("/pay/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield Player_1.default.findOne({ _id: req.params.id });
        if (!user) {
            return res.status(404).json({ err: "Код не найден" });
        }
        user.change_date = new Date();
        yield user.save();
        yield Prize_1.default.updateMany({ _id: { $in: user.prizes } }, { payed: true });
        res.redirect(303, "/users/find/all/ndfl");
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// get all claimed prizes
router.get("/find/claimed", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.query);
        const keys = Object.keys(req.query);
        const PRIZE_QUERY = {
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
        let codes = yield Prize_1.default.find(PRIZE_QUERY).populate("player");
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// get all validated codes
router.get("/find/validated", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const codes = yield Prize_1.default.find({ validated: true }).populate("player");
        res.json(codes);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// get all codes
router.get("/find/all", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const keys = Object.keys(req.query);
        const PRIZE_QUERY = {};
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
        let codes = yield Prize_1.default.find(PRIZE_QUERY)
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
/// gen chunk
router.post("/generatecodes", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const QRNumber = req.body.count;
        const price = req.body.price;
        const type = req.body.type;
        if (type >= QRConfig.length)
            return res.status(400).json({ err: "invalid type" });
        const selectedConfig = QRConfig[type];
        const { instructionName, font, size, y, color, margin, fill } = selectedConfig;
        let instruction;
        let bg;
        yield image_to_base64_1.default(__dirname + `/../../${instructionName}`).then((response) => (instruction = response));
        if (type === 1) {
            yield image_to_base64_1.default(__dirname + "/../../bgNew.jpg").then((response) => (bg = response));
        }
        let date = new Date();
        date =
            date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate();
        let QRurl;
        const archName = `${date}-${price.toString()}-${QRNumber}-${Math.random()
            .toString(36)
            .substr(2, 6)
            .toLowerCase()}.zip`;
        const filenameArray = [];
        let output;
        try {
            output = fs_1.default.createWriteStream(path_1.default.normalize(__dirname + "/../public/archive/" + archName));
        }
        catch (error) {
            console.error(error);
        }
        const archive = archiver_1.default("zip", {
            zlib: { level: 6 },
        });
        archive.pipe(output);
        archive.on("error", (err) => {
            if (err)
                throw err;
        });
        const QR_ARRAY = [];
        const PRIZE_ARRAY = [];
        const createPDF = (num, start, end) => __awaiter(void 0, void 0, void 0, function* () {
            let a = 1;
            const filename = start + "-" + end + ".pdf";
            const file = path_1.default.normalize(__dirname + `/../public/pdf/${filename}`);
            console.log("pre");
            const doc = new jspdf_1.jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: canvasSize,
            });
            const border = margin + 10;
            while (a <= num) {
                const code1 = Math.random().toString(36).substr(3, 4).toLowerCase();
                const code2 = Math.random().toString(36).substr(3, 4).toLowerCase();
                const code3 = Math.random().toString(36).substr(3, 4).toLowerCase();
                const code4 = Date.now().toString(36).substr(4).toLowerCase();
                const CodeFinal = code1 + code2 + code3 + code4;
                let CodePrint = code1 + "-" + code2 + "-" + code3 + "-" + code4;
                const QR_CODE = makeid(7) + Date.now().toString(36).toUpperCase();
                const QRinput = process.env.win_url + QR_CODE;
                yield qrcode_1.default.toDataURL(QRinput, {
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
                doc.addFileToVFS(`${font}.ttf`, sans_1.fonts[type]);
                doc.addFont(`${font}.ttf`, font, `normal`);
                doc.setFont(font);
                doc.setFillColor("#FAD620");
                if (bg) {
                    doc.addImage(bg, "jpeg", margin, margin, canvasSize[1] - margin * 2, canvasSize[1] - margin * 2);
                    CodePrint = CodePrint.toUpperCase();
                }
                // else {
                //     doc.rect(5, 5, 310, 310, "FD");
                // }
                doc.rect(margin, margin, canvasSize[1] - margin * 2, canvasSize[1] - margin * 2, fill);
                doc.setFontSize(size);
                doc.setTextColor(color);
                doc.addImage(QRurl, "png", border, border, canvasSize[1] - border * 2, canvasSize[1] - border * 2);
                doc.addImage(instruction, "jpeg", 315 + margin, margin, 135 - margin * 2, 320 - margin * 2);
                // doc.addImage(mainQR, "jpeg", 343.8, 226.5, 77.4, 73.5);
                doc.text(CodePrint, 383, y, null, "center");
                doc.rect(315 + margin, margin, 135 - margin * 2, 320 - margin * 2);
                const PrizeObj = new Prize_1.default({
                    code: CodeFinal,
                    value: price,
                    validated: false,
                    date: Date.now(),
                    qr: undefined,
                });
                const QRObj = new QR_urls_1.default({ code: QR_CODE, url: QRinput });
                QR_ARRAY.push(QRObj);
                PRIZE_ARRAY.push(PrizeObj);
                a += 1;
            }
            console.log("save");
            doc.save(file);
            archive.file(file, { name: filename });
            filenameArray.push(filename);
            console.log("next cycle");
        });
        const func = (count) => __awaiter(void 0, void 0, void 0, function* () {
            const numerator = 250;
            let ind = 0;
            let firstNum = 1;
            let numLeft = count;
            while (ind < count) {
                if (numLeft >= numerator) {
                    ind += numerator;
                    numLeft -= numerator;
                    yield createPDF(numerator, firstNum, ind);
                    firstNum += numerator;
                }
                else {
                    ind += 1;
                    yield createPDF(numLeft, ind, count);
                    break;
                }
            }
        });
        yield func(QRNumber);
        output.on("close", () => __awaiter(void 0, void 0, void 0, function* () {
            const NewBundle = new Bundle_1.default({
                amount: QRNumber,
                date: new Date(),
                value: price,
                archive_path: `archive/${archName}`,
                prizes: PRIZE_ARRAY,
                qrs: QR_ARRAY,
            });
            yield NewBundle.save();
            yield Prize_1.default.insertMany(PRIZE_ARRAY);
            yield QR_urls_1.default.insertMany(QR_ARRAY);
            res.json(NewBundle
            // path.resolve(__dirname + `/../public/archive/` + archName),
            // archName
            );
        }));
        yield archive.finalize();
        const directory = path_1.default.normalize(__dirname + "/../public/pdf");
        for (const fuck of filenameArray) {
            fs_1.default.unlink(path_1.default.join(directory, fuck), (err) => {
                if (err)
                    throw err;
            });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
exports.default = router;
//# sourceMappingURL=codes.js.map