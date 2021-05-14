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
import auth from "../middleware/auth";
function regexEscape(str: string) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

// get all users
router.get("/find/all", auth, async (req: Request, res: Response) => {
  try {
    const keys = Object.keys(req.query);
    const QUERY_OBJ: any = {};
    for (const key of keys) {
      QUERY_OBJ[key] = req.query[key];
    }
    const users = await Player.find(QUERY_OBJ)
      .populate("prizes")
      .sort({ change_date: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// regex query
router.get("/find/query", auth, async (req: Request, res: Response) => {
  try {
    const a: any = req.query;
    console.log(req.query)
    const query: any = {};
    query[a.field] = { $regex: regexEscape(a.value), $options: "i" };
    const user = await Player.find(query)
      .populate("prizes")
      .sort({ change_date: -1 });
    res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get all users with >4k winnings
router.get("/find/all/ndfl", auth, async (req: Request, res: Response) => {
  try {
    const keys = Object.keys(req.query);
    const QUERY_OBJ: any = {
      prize_sum: { $gt: Number(req.query.gt ? req.query.gt : 4000) },
    };
    for (const key of keys) {
      if (key !== "gt") {
        QUERY_OBJ[key] = req.query[key];
      }
    }
    const users = await Player.find(QUERY_OBJ)
      .populate("prizes")
      .sort({ change_date: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

export default router;
