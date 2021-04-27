import { model, Schema, Model, Document, ObjectId } from "mongoose";
// import { IPrize } from "./Prize";

export interface IStat extends Document {
  date: Date;
  day: number;
  month: number;
  year: number;
  PrizesActivated: number;
  PrizesClaimed: number;
  WinningsClaimed: number;
  TotalWinnings: number;
  newUsers: number;
  //   url: string;
  //   code: string;
}

const QRStatSchema = new Schema({
  date: { type: Date },
  day: {
    type: Number,
  },
  month: {
    type: Number,
  },
  year: {
    type: Number,
  },
  PrizesActivated: {
    type: Number,
    default: 0,
  },
  PrizesClaimed: { type: Number, default: 0 },
  WinningsClaimed: { type: Number, default: 0 },
  TotalWinnings: {
    type: Number,
    default: 0,
  },
  newUsers: {
    type: Number,
    default: 0,
  },
});

const QRStat = model<IStat>("qrstat", QRStatSchema);
export default QRStat;
