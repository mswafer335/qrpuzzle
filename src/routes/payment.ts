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
      return res.json({ err: "Указанный код не активирован" });
    }
    if (prize.payed) {
      return res.status(400).json({ err: "Указанный код уже был использован" });
    }
    return
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

export default router;
