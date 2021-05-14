import { Response, Request, Router } from "express";
const router = Router();
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });
import { callbackApi, asyncApi } from "node-qiwi-api";

import fs from "fs";
import path from "path";
import Prize, { IPrize } from "../models/Prize";
import QR, { IQR } from "../models/QR-urls";
import Bundle from "../models/Bundle";
import Player from "../models/Player";
import auth from "../middleware/auth";

const callbackWallet = new callbackApi(process.env.QIWI_TOKEN);
const asyncWallet = new asyncApi(process.env.QIWI_TOKEN);
const luhnAlgorithm = (digits: string) => {
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
router.put("/phone", async (req: Request, res: Response) => {
  try {
    const prize = await Prize.findOne({ code: req.body.code }).populate(
      "player"
    );
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
        err:
          "Коды суммой более 50 рублей нельзя использовать для пополнения счета телефона",
      });
    }
    if (prize.player.prize_sum > 4000) {
      return res.status(400).json({ err: "Оплата выше 4к так не работает" });
    }
    await callbackWallet.toMobilePhone(
      {
        amount: prize.value,
        comment: "Выигрыш кода QR пазла",
        account: req.body.phone,
      },
      async (err: any, data: any) => {
        if (err) {
          prize.payed = false;
          console.log("err", err);
          await prize.save();
          return res.json({ msg: "Что-то пошло не так", payed: false });
        } else {
          await Player.findOneAndUpdate(
            { prizes: prize._id },
            { change_date: new Date() }
          );
          console.log("data", data);
          prize.payed = true;
          await prize.save();
          return res.json({ msg: "Деньги отправлены", payed: true });
        }
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// card payment
router.put("/card", async (req: Request, res: Response) => {
  try {
    const prize = await Prize.findOne({ code: req.body.code }).populate(
      "player"
    );
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
        err:
          "Допустимый диапазон призов для вывода на карту - от 51 до 4000 рублей",
      });
    }
    if (prize.player.prize_sum > 4000) {
      return res.status(400).json({ err: "Оплата выше 4к так не работает" });
    }
    if (!luhnAlgorithm(req.body.card)) {
      return res.status(400).json({ err: "Введена неверная карта" });
    }
    const response: any = {};
    await callbackWallet.toCard(
      {
        amount: prize.value,
        comment: "Выигрыш кода QR пазла",
        account: req.body.card,
      },
      async (err: any, data: any) => {
        if (err || data === undefined) {
          prize.payed = false;
          console.log("err", err);
          // const response: any = {};
          response.msg = "Что-то пошло не так";
          response.payed = false;
          await prize.save();
          return res.status(400).json(response);
        } else {
          await Player.findOneAndUpdate(
            { prizes: prize._id },
            { change_date: new Date() }
          );
          prize.payed = true;
          console.log("data", data);
          // const response: any = {};
          response.msg = "Оплата прошла?";
          response.payed = true;
          await prize.save();
          return res.json(response);
        }
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

export default router;
