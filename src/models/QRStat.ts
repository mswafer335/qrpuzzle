import { model, Schema, Model, Document, ObjectId } from "mongoose";
// import { IPrize } from "./Prize";

export interface IStat extends Document {
  date: Date;
  day: number;
  month: number;
  year: number;
  PrizesActivated: number;
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
  },
  TotalWinnings: {
    type: Number,
  },
  newUsers: {
    type: Number,
  },
});

const QRStat = model<IStat>("qrstat", QRStatSchema);
export default QRStat;
