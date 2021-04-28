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

// phone payment
router.put("/phone", async (req: Request, res: Response) => {
  try {
    let prize = await Prize.findOne({ code: req.body.code });
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
    let pay = await asyncWallet.toMobilePhone({
      amount: prize.value,
      comment: "Выигрыш кода QR пазла",
      account: req.body.phone,
    });
    console.log(pay);
    prize.payed = true;
    await prize.save();
    return res.json({ msg: "Деньги отправлены" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// card payment
router.put("/card", async (req: Request, res: Response) => {
  try {
    let prize = await Prize.findOne({ code: req.body.code });
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
    prize.payed = true;
    await callbackWallet.toCard(
      {
        amount: prize.value,
        comment: "Выигрыш кода QR пазла",
        account: req.body.card,
      },
      (err: any, data: any) => {
        if (err) {
          prize.payed = false;
          throw err;
        }
        console.log(data);
      }
    );
    //   console.log(pay)
    await prize.save();
    return res.json({ msg: "Деньги отправлены" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

export default router;
