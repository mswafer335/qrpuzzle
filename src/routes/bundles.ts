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
    const bundles = await Bundle.find();
    return res.json(bundles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ err: "server error" });
  }
});

// get single bundle
router.get("/find/id/:id", auth, async (req: Request, res: Response) => {
  try {
    const bundle = await Bundle.findOne({ _id: req.params.id }).populate(
      "prizes"
    );
    if (!bundle) {
      return res.status(404).json({ err: "Не найдено" });
    }
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
    res.redirect(303, `/bundles/find/id/${req.params.id}`);
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
    fs.unlinkSync(__dirname + "/public/" + bundle.archive_path);
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
