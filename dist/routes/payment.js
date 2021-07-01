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
const crypto_1 = __importDefault(require("crypto"));
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
        if (prize.value > 20) {
            return res.status(400).json({
                err: "Коды суммой более 20 рублей нельзя использовать для пополнения счета телефона",
            });
        }
        if (prize.player.prize_sum > 4000) {
            return res.status(400).json({ err: "Оплата выше 4к так не работает" });
        }
        yield axios_1.default({
            method: "get",
            url: process.env.API_URL_PHONE +
                `alef_action=payment&apikey=${process.env.API_URL_PHONE}&phone_number=${req.body.phone}&amount=${prize.value}&is_demo=1`,
        })
            .then((response) => {
            console.log(response);
            if (response.status !== 0) {
                prize.payed = false;
                res.json({ msg: "Что-то пошло не так", payed: false });
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
// card payment
router.put("/card", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (prize.value < 20 || prize.value > 4000) {
            return res.status(400).json({
                err: "Допустимый диапазон призов для вывода на карту - от 51 до 4000 рублей",
            });
        }
        if (prize.player.prize_sum > 4000) {
            return res.status(400).json({ err: "Оплата выше 4к так не работает" });
        }
        if (!luhnAlgorithm(req.body.card)) {
            return res.status(400).json({ err: "Введена неверная карта" });
        }
        const body = {
            account: process.env.zingAcc,
            amount: prize.value,
            customer_card_number: req.body.card,
        };
        const signValue = `${body.account}|${body.amount}|${body.customer_card_number}`;
        const sign = crypto_1.default
            .createHmac("sha256", process.env.zingSecret)
            .update(signValue)
            .digest()
            .toString("base64");
        yield axios_1.default({
            method: "post",
            url: `${process.env.zingUrl}/withdrawal/init`,
            data: body,
            headers: {
                MerchantKey: process.env.merchantKey,
                Sign: sign,
            },
        }).then((response) => console.log(response));
        // await callbackWallet.toCard(
        //   {
        //     amount: prize.value,
        //     comment: "Выигрыш кода QR пазла",
        //     account: req.body.card,
        //   },
        //   async (err: any, data: any) => {
        //     if (err || data === undefined) {
        //       prize.payed = false;
        //       console.log("err", err);
        //       response.msg = "Что-то пошло не так";
        //       response.payed = false;
        //       await prize.save();
        //       return res.status(400).json(response);
        //     } else {
        //       await Player.findOneAndUpdate(
        //         { prizes: prize._id },
        //         { change_date: new Date() }
        //       );
        //       prize.payed = true;
        //       console.log("data", data);
        //       // const response: any = {};
        //       response.msg = "Оплата прошла?";
        //       response.payed = true;
        //       await prize.save();
        //       return res.json(response);
        //     }
        //   }
        // );
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
exports.default = router;
//# sourceMappingURL=payment.js.map