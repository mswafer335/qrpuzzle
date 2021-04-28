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
const callbackWallet = new node_qiwi_api_1.callbackApi(process.env.QIWI_TOKEN);
const asyncWallet = new node_qiwi_api_1.asyncApi(process.env.QIWI_TOKEN);
// phone payment
router.put("/phone", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prize = yield Prize_1.default.findOne({ code: req.body.code });
        if (!prize) {
            return res.status(404).json({ err: "Указанный код не найден" });
        }
        if (!prize.validated || !prize.player) {
            return res.status(400).json({ err: "Указанный код не активирован" });
        }
        if (prize.payed) {
            return res.status(400).json({ err: "Указанный код уже был использован" });
        }
        if (prize.value > 50) {
            return res.status(400).json({
                err: "Коды суммой более 50 рублей нельзя использовать для пополнения счета телефона",
            });
        }
        prize.payed = true;
        yield callbackWallet.toMobilePhone({
            amount: prize.value,
            comment: "Выигрыш кода QR пазла",
            account: req.body.phone,
        }, (err, data) => {
            if (err) {
                prize.payed = false;
                console.log("err", err);
            }
            console.log("data", data);
        });
        // let pay = await asyncWallet.toMobilePhone({
        //   amount: prize.value,
        //   comment: "Выигрыш кода QR пазла",
        //   account: req.body.phone,
        // });
        // console.log(pay);
        // prize.payed = true;
        yield prize.save();
        return res.json({ msg: "Деньги отправлены" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
// card payment
router.put("/card", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prize = yield Prize_1.default.findOne({ code: req.body.code });
        if (!prize) {
            return res.status(404).json({ err: "Указанный код не найден" });
        }
        if (!prize.validated || !prize.player) {
            return res.status(400).json({ err: "Указанный код не активирован" });
        }
        if (prize.payed) {
            return res.status(400).json({ err: "Указанный код уже был использован" });
        }
        if (prize.value < 50 || prize.value > 4000) {
            return res.status(400).json({
                err: "Допустимый диапазон призов для вывода на карту - от 51 до 4000 рублей",
            });
        }
        prize.payed = true;
        let test = 1;
        console.log(test);
        yield callbackWallet.toCard({
            amount: prize.value,
            comment: "Выигрыш кода QR пазла",
            account: req.body.card,
        }, (err, data) => {
            if (err) {
                console.log("err", err);
            }
            test = data;
            console.log("data", data);
            console.log("test", test);
        });
        // if(test === undefined){
        //     prize.payed = false
        // }
        const response = {};
        console.log("after", test);
        if (test === undefined) {
            prize.payed = false;
            response.msg = "Ошибка якась";
        }
        else {
            prize.payed = true;
            response.msg = "Вроде прошло";
        }
        // test === undefined ? prize.payed = false : prize.payed = true
        yield prize.save();
        return res.json(response);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ err: "server error" });
    }
}));
exports.default = router;
//# sourceMappingURL=payment.js.map