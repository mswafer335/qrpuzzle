import { model, Schema, Model, Document, ObjectId } from "mongoose";
import { IPrize } from "./Prize";

export interface IPlayer extends Document {
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  phone: string;
  prizes: IPrize["_id"];
  prize_sum: number;
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
  prizes: [
    {
      type: Schema.Types.ObjectId,
      ref: "prize",
      default: [],
    },
  ],
  prize_sum: { type: Number, default: 0 },
});

export default model<IPlayer>("player", PlayerSchema);
