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
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: __dirname + "/.env" });
const node_qiwi_api_1 = require("node-qiwi-api");
const Prize_1 = __importDefault(require("../models/Prize"));
const Player_1 = __importDefault(require("../models/Player"));
const axios_1 = __importDefault(require("axios"));
const binlookup_1 = __importDefault(require("binlookup"));
const virtCheck = binlookup_1.default();
const callbackWallet = new node_qiwi_api_1.callbackApi(process.env.QIWI_TOKEN);
const asyncWallet = new node_qiwi_api_1.asyncApi(process.env.QIWI_TOKEN);
const luhnAlgorithm = (digits) => {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        let cardNum = parseInt(digits[i], 10);
        if (i % 2 === 0) {
            cardNum = cardNum * 2;
            if (cardNum > 9) {
                cardNum = cardNum - 9;
            }
        }
        sum += cardNum;
    }
    return sum % 10 === 0;
};
// phone payment
router.put("/phone", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prize = yield Prize_1.default.findOne({ code: req.body.code }).populate("player");
        if (!prize) {
            return res.status(404).json({ err: "Указанный код не найден" });
        }
        if (!prize.validated || !prize.player) {
            return res.status(400).json({ err: "Указанный код не активирован" });
        }
        if (prize.payed) {
            return res.status(400).json({ err: "Указанный код уже был использован" });
        }
        // if (prize.value > 20) {
        //   return res.status(400).json({
        //     err: "Коды суммой более 20 рублей нельзя использовать для пополнения счета телефона",
        //   });
        // }
        if (prize.player.prize_sum > 4000) {
            return res.status(400).json({ err: "Оплата выше 4к так не работает" });
        }
        yield axios_1.default({
            method: "get",
            url: process.env.API_URL_PHONE +
                `alef_action=payment&apikey=${process.env.API_KEY}&phone_number=7${req.body.phone}&amount=${prize.value}&is_demo=0`,
        })
            .then((response) => {
            console.log(response.data);
            if (response.data.status !== 0) {
                prize.payed = false;
                res.status(400).json({ msg: "Что-то пошло не так", payed: false });
            }
            else {
                prize.payed = true;
                res.json({ msg: "Деньги отправлены", payed: true });
                return Player_1.default.findOneAndUpdate({ prizes: prize._id }, { change_date: new Date() });
            }
        })
            .then(() => prize.save());
        // await callbackWallet.toMobilePhone(
        //   {
        //     amount: prize.value,
        //     comment: "Выигрыш кода QR пазла",
        //     account: req.body.phone,
        //   },
        //   async (err: any, data: any) => {
        //     if (err) {
        //       prize.payed = false;
        //       console.log("err", err);
        //       await prize.save();
        //       return res.json({ msg: "Что-то пошло не так", payed: false });
        //     } else {
        //       await Player.findOneAndUpdate(
        //         { prizes: prize._id },
        //         { change_date: new Date() }
        //       );
        //       console.log("data", data);
        //       prize.payed = true;
        //       await prize.save();
        //       return res.json({ msg: "Деньги отправлены", payed: true });
        //     }
        //   }
        // );
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// // card payment
// router.put("/card", async (req: Request, res: Response) => {
//   try {
//     const prize = await Prize.findOne({ code: req.body.code }).populate(
//       "player"
//     );
//     if (!prize) {
//       return res.status(404).json({ err: "Указанный код не найден" });
//     }
//     if (!prize.validated || !prize.player) {
//       return res.status(400).json({ err: "Указанный код не активирован" });
//     }
//     if (prize.payed) {
//       return res.status(400).json({ err: "Указанный код уже был использован" });
//     }
//     if (prize.value < 20 || prize.value > 4000) {
//       return res.status(400).json({
//         err: "Допустимый диапазон призов для вывода на карту - от 21 до 4000 рублей",
//       });
//     }
//     if (prize.player.prize_sum > 4000) {
//       return res.status(400).json({ err: "Оплата выше 4к так не работает" });
//     }
//     if (!luhnAlgorithm(req.body.card)) {
//       return res.status(400).json({ err: "Введена неверная карта" });
//     }
//     const qiwiCheck = await virtCheck(req.body.card)
//     console.log(qiwiCheck)
//     if((qiwiCheck.bank.url&&qiwiCheck.bank.name)&&(qiwiCheck.bank.url==="www.qiwi.com"||qiwiCheck.bank.name.match(/qiwi/gi))){
//       return res.status(400).json({err:"Карты QIWI не поддерживаются"})
//     }
//     const login = await axios({
//       method: "post",
//       url: `${process.env.vintageUrl}/app/login`,
//       data: {
//         username: process.env.vintageLogin,
//         password: process.env.vintagePassword,
//       },
//     });
//     let a: any;
//     const resp: any = {};
//     const body = {
//       accountId: process.env.vintageAccountId,
//       method: "rub-card-1",
//       amount: prize.value * 100,
//       credentials: { cardNumber: req.body.card.toString() },
//       note: "Выигрыш Millionpuzzle",
//     };
//     await axios({
//       method: "post",
//       url: `${process.env.vintageUrl}/app/withdrawalMoney`,
//       data: body,
//       headers: {
//         Token: login.data.token,
//       },
//     }).then((response) => (a = response));
//     if ((a.data.err && a.data.err !== "null") || a.data === undefined) {
//       prize.payed = false;
//       console.log("err", a.data);
//       resp.msg = "Что-то пошло не так";
//       resp.payed = false;
//       await prize.save();
//       return res.status(400).json(resp);
//     } else {
//       await Player.findOneAndUpdate(
//         { prizes: prize._id },
//         { $set: { change_date: new Date(), payed: true } }
//       );
//       prize.payed = true;
//       await prize.save()
//       console.log("data", a.data);
//       resp.msg = "Оплата прошла?";
//       resp.payed = true;
//       return res.json(resp);
//     }
//     // await callbackWallet.toCard(
//     //   {
//     //     amount: prize.value,
//     //     comment: "Выигрыш кода QR пазла",
//     //     account: req.body.card,
//     //   },
//     //   async (err: any, data: any) => {
//     //     if (err || data === undefined) {
//     //       prize.payed = false;
//     //       console.log("err", err);
//     //       response.msg = "Что-то пошло не так";
//     //       response.payed = false;
//     //       await prize.save();
//     //       return res.status(400).json(response);
//     //     } else {
//     //       await Player.findOneAndUpdate(
//     //         { prizes: prize._id },
//     //         { change_date: new Date() }
//     //       );
//     //       prize.payed = true;
//     //       console.log("data", data);
//     //       // const response: any = {};
//     //       response.msg = "Оплата прошла?";
//     //       response.payed = true;
//     //       await prize.save();
//     //       return res.json(response);
//     //     }
//     //   }
//     // );
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ err: "server error" });
//   }
// });
exports.default = router;
//# sourceMappingURL=payment.js.map