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
  const { email, password } = req.body;

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

export default router;
