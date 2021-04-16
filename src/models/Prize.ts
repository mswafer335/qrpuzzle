import { model, Schema, Model, Document } from "mongoose";
import { IPlayer } from "./Player";
import { IQR } from "./QR-urls";

export interface IPrize extends Document {
  code: string;
  date: Date;
  value: number;
  printed: boolean;
  validated: boolean;
  qr: IQR["_id"];
  player: IPlayer["_id"];
  payed: boolean;
}

const PrizeSchema: Schema = new Schema({
  code: {
    type: String,
  },
  date: {
    type: Date,
  },
  value: {
    type: Number,
  },
  printed: {
    type: Boolean,
    default: false,
  },
  validated: {
    type: Boolean,
    default: false,
  },
  qr: { type: Schema.Types.ObjectId, ref: "qr", default: undefined },
  player: { type: Schema.Types.ObjectId, ref: "player", default: undefined },
  payed: {
    type: Boolean,
    default: false,
  },
});

export default model<IPrize>("prize", PrizeSchema);
