import * as dotenv from "dotenv";
import QRStat from "../models/QRStat";
import newStat from "./newStat";
dotenv.config();

export = async (newInfoObject: object) => {
  try {
    await QRStat.findOneAndUpdate({ _id: await newStat() }, newInfoObject);
    return
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};
