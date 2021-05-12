import { model, Schema, Model, Document, ObjectId } from "mongoose";
import { IPrize } from "./Prize";

export interface IPlayer extends Document {
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  phone: string;
  comment: string;
  prizes: IPrize["_id"];
  prizes_activated: number;
  prize_sum: number;
  tax_sum: number;
  sum_ndfl: number;
}

const PlayerSchema = new Schema({
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  fullname: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  comment: { type: String },
  prizes: [
    {
      type: Schema.Types.ObjectId,
      ref: "prize",
      default: [],
    },
  ],
  prizes_activated: { type: Number, default: 0 },
  prize_sum: { type: Number, default: 0 },
  tax_sum: { type: Number, default: 0 },
  sum_ndfl: { type: Number },
});

export default model<IPlayer>("player", PlayerSchema);
