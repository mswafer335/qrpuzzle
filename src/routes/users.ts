import { Response, Request, Router } from "express";
const router = Router();
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

import fs from "fs";
import path from "path";
import Prize, { IPrize } from "../models/Prize";
import QR, { IQR } from "../models/QR-urls";
import Bundle from "../models/Bundle";
import Player from "../models/Player";

// get all users
router.get("/find/all", async (req: Request, res: Response) => {
  try {
    const users = await Player.find().populate("prizes");
    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get single user
router.get("/find/:phone", async (req: Request, res: Response) => {
  try {
    const user = await Player.findOne({
      phone: { $regex: req.params.phone, $options: "i" },
    }).populate("prizes");
    if (!user) {
      return res
        .status(404)
        .json({ err: "Пользователь с указанным номером телефона не найден" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get all users with >4k winnings
router.get("/find/ndfl", async (req: Request, res: Response) => {
  try {
    const users = await Player.find({ prize_sum: { $gt: 4000 } });
    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

export default router;
