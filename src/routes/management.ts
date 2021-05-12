import { Response, Request, Router } from "express";
const router = Router();
import * as dotenv from "dotenv";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
dotenv.config({ path: __dirname + "/.env" });

import fs from "fs";
import path from "path";
import Prize, { IPrize } from "../models/Prize";
import QR, { IQR } from "../models/QR-urls";
import Bundle from "../models/Bundle";
import Player from "../models/Player";
import Admin from "../models/Admin";
import auth from "../middleware/auth";
import QRStat from "../models/QRStat";

// new admin
router.post("/register", async (req: Request, res: Response) => {
  try {
    const salt = await bcrypt.genSalt(12);
    const password = await bcrypt.hash(req.body.password, salt);
    const admin = new Admin({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      fullname: req.body.lastname + " " + req.body.firstname,
      phone: req.body.phone,
      email: req.body.email,
      password,
    });
    await admin.save();
    // jsonwebtoken return
    const payload = { admin: { id: admin.id } };

    jwt.sign(
      payload,
      process.env.jwtSecret,
      { expiresIn: 360000000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          id: admin.id,
          msg: "Новый пользователь зарегестрирован",
        });
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// authentification
router.post("/auth", async (req: Request, res: Response) => {
  const { password } = req.body;

  try {
    const user = await Admin.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({
        errors: [{ err: "Пользователь с указанным email не найден" }],
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ errors: [{ err: "Неверный пароль" }] });
    }

    // jsonwebtoken return
    const payload = {
      admin: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.jwtSecret,
      { expiresIn: 360000000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ err: "server error" });
  }
});

// get stats for 1 day
router.get("/stats/oneday", auth, async (req, res) => {
  try {
    const query = {
      day: Number(req.query.day),
      month: Number(req.query.month),
      year: Number(req.query.year),
    };
    const stat = await QRStat.findOne(query);
    return res.json(stat);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get all stats by weeks
router.get("/stats/week", auth, async (req, res) => {
  try {
    const StatQuery = await QRStat.find();
    const StatDaily = [...StatQuery];
    const arr = [];
    const func = (stats: any) => {
      const fArr = [];
      while (fArr.length < 7 && stats.length > 0) {
        fArr.push(stats.pop());
      }
      const week = {
        PrizesClaimed: 0,
        PrizesActivated: 0,
        WinningsClaimed: 0,
        TotalWinnings: 0,
        newUsers: 0,
        date: fArr[fArr.length - 1].date,
      };
      for (const el of fArr) {
        week.PrizesClaimed += el.PrizesClaimed;
        week.PrizesActivated += el.PrizesActivated;
        week.WinningsClaimed += el.WinningsClaimed;
        week.TotalWinnings += el.TotalWinnings;
        week.newUsers += el.newUsers;
      }
      return week;
    };
    while (StatQuery.length >= 1) {
      arr.push(func(StatQuery));
    }
    const bundles = await Bundle.find();
    let totalCodes: number = 0;
    let totalSum: number = 0;
    let totalNonValidated: number = 0;
    let totalNonValidatedSum: number = 0;
    for (const bundle of bundles) {
      totalCodes += bundle.amount;
      totalSum += bundle.amount * bundle.value;
      totalNonValidated += bundle.amount - bundle.amount_validated;
      totalNonValidatedSum +=
        (bundle.amount - bundle.amount_validated) * bundle.value;
    }
    res.json({
      stats: arr.reverse(),
      totalCodes,
      totalSum,
      totalNonValidated,
      totalNonValidatedSum,
      StatDaily,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

//add comment
router.put("/comment/:id", async (req: Request, res: Response) => {
  try {
    let user = await Player.findOne({ _id: req.params.id });
    if (!user) {
      return res
        .status(404)
        .json({ err: "Пользователь с указанным id не найден" });
    }
    user.comment = req.body.comment;
    await user.save();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

//count fix
router.get("/kostil/fix", async (req: Request, res: Response) => {
  try {
    let users = await Player.find();
    for (let user of users) {
      user.prizes_activated = user.prizes.length;
      await user.save();
      console.log(user.prizes_activated);
    }
    return res.json("uspeh");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});
export default router;
