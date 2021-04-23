import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectDB } from "./middleware/db";
import code_route from "./routes/codes";
import bundle_route from "./routes/bundles";
import user_route from "./routes/users";
import admin_route from "./routes/management";
import * as dotenv from "dotenv";
import newStat from "./middleware/newStat";
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

const PORT = process.env.PORT || 1370;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));

const GovnaKusok = async () => {
  await newStat();
  console.log("huy");
  setTimeout(GovnaKusok, 10800000);
};
GovnaKusok();
