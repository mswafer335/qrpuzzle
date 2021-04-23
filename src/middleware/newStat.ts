import * as dotenv from "dotenv";
import QRStat,{IStat}  from "../models/QRStat"
dotenv.config();

export = async() => {
  try {
    const d = new Date();
    let stat = await QRStat.findOne({
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
    if (!stat) {
      stat = new QRStat({
        date: d,
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      });
      await stat.save();
    }
    return stat._id
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}