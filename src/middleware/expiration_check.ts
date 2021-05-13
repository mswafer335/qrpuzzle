import * as dotenv from "dotenv";
import Prize from "../models/Prize";
dotenv.config();

export = async () => {
  try {
    const prizes = await Prize.find({
      expired: { $ne: true },
      ActivationDate: { $ne: undefined },
    });
    const date = new Date();
    for (const prize of prizes) {
      if (
        prize.value <= 4000 &&
        Number(date) - Number(prize.ActivationDate) > 604800000
      ) {
        prize.expired = true;
        await prize.save();
      }
    }
  } catch (error) {
    console.error(error);
  }
};
