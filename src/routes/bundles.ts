import { Response, Request, Router } from "express";
const router = Router();
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

import fs from "fs";
import path from "path";
import Prize, { IPrize } from "../models/Prize";
import QR, { IQR } from "../models/QR-urls";
import Bundle from "../models/Bundle";
import auth from "../middleware/auth";

// get all bundles
router.get("/find/all", auth, async (req: Request, res: Response) => {
  try {
    const QUERY_OBJ: any = {};
    const keys = Object.keys(req.query);
    for (const key of keys) {
      QUERY_OBJ[key] = req.query[key];
    }
    const bundles = await Bundle.find(QUERY_OBJ);
    return res.json(bundles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get single bundle
router.get("/find/id", auth, async (req: Request, res: Response) => {
  try {
    const bundle = await Bundle.findOne({ _id: req.query.id }).populate({
      path: "prizes",
      populate: { path: "player" },
    });
    if (!bundle) {
      return res.status(404).json({ err: "Не найдено" });
    }
    delete req.query.id;
    if (req.query.fullname) {
      bundle.prizes = bundle.prizes.filter((el: any) => {
        const regex = new RegExp(req.query.fullname.toString());
        return el.player && regex.test(el.player.fullname);
      });
      delete req.query.fullname;
    }
    if (req.query.phone) {
      bundle.prizes = bundle.prizes.filter((el: any) => {
        const regex = new RegExp(req.query.phone.toString());
        return el.player && regex.test(el.player.phone);
      });
      delete req.query.phone;
    }
    const keys = Object.keys(req.query);
    for (const key of keys) {
      if (req.query[key] === "true") {
        // @ts-ignore:
        req.query[key] = true;
      }
      if (req.query[key] === "false") {
        // @ts-ignore:
        req.query[key] = false;
      }
    }
    if (keys.length > 0) {
      for (const key of keys) {
        bundle.prizes = bundle.prizes.filter((prize: any) => {
          return prize[key] === req.query[key];
        });
      }
    }
    bundle.prizes.sort((a: any, b: any) => {
      if (a.ActivationDate && b.ActivationDate) {
        return b.ActivationDate - a.ActivationDate;
      } else if (!a.ActivationDate && a.validated) {
        return -1;
      } else if (!b.ActivationDate && b.validated) {
        return 1;
      } else if (!a.ActivationDate) {
        return 1;
      } else if (!b.ActivationDate) {
        return -1;
      } else {
        return 0;
      }
    });
    return res.json(bundle);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// change print status
router.put("/change/print/:id", auth, async (req: Request, res: Response) => {
  try {
    const bundle = await Bundle.findOne({ _id: req.params.id });
    if (!bundle) {
      return res.status(404).json({ err: "Не найдено" });
    }
    bundle.printed = !bundle.printed;
    bundle.print_date = new Date();
    await bundle.save();
    res.redirect(303, `/bundles/find/all`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// download archive
router.get("/download/:id", auth, async (req: Request, res: Response) => {
  const bundle = await Bundle.findOne({ _id: req.params.id });
  if (!bundle) {
    return res.status(404).json({ err: "Не найдено" });
  }
  bundle.download_date = new Date();
  bundle.download_num += 1;
  await bundle.save();
  res.download(
    path.resolve(__dirname + "/../public/" + bundle.archive_path),
    bundle.archive_path.split("/").pop()
  );
});

// delete bundle
router.delete("/delete/:id", auth, async (req: Request, res: Response) => {
  try {
    const bundle = await Bundle.findOne({ _id: req.params.id });
    fs.unlinkSync(__dirname + "/../public/" + bundle.archive_path);
    if (!bundle.printed) {
      await Prize.deleteMany({ _id: { $in: bundle.prizes } });
      await QR.deleteMany({ _id: { $in: bundle.qrs } });
    }
    await bundle.remove();
    res.redirect(303, "/bundles/find/all");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

export default router;
