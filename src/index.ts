import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectDB } from "./middleware/db";
import code_route from "./routes/codes";
import bundle_route from "./routes/bundles";
import user_route from "./routes/users";
import admin_route from "./routes/management";
import payment_route from "./routes/payment";
import * as dotenv from "dotenv";
import newStat from "./middleware/newStat";
import expiration_check from "./middleware/expiration_check";
import axios from "axios";
import crypto from "crypto";
import FormData from "form-data";
dotenv.config();
const app: Application = express();

connectDB();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/archive", express.static(__dirname + "/archive"));

app.get("/", (req: Request, res: Response) => res.send("no hack plz"));

app.use("/codes", code_route);
app.use("/bundles", bundle_route);
app.use("/users", user_route);
app.use("/admin", admin_route);
app.use("/pay", payment_route);

const PORT = process.env.PORT || 1370;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));

const StatChecker = async () => {
  await newStat();
  setTimeout(StatChecker, 1000 * 60 * 60 * 3);
};
const ExpireCheck = async () => {
  await expiration_check();
  setTimeout(ExpireCheck, 1000 * 60 * 60 * 1);
};

StatChecker();
ExpireCheck();
