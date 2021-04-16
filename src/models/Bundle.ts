import { model, Schema, Model, Document } from "mongoose";
import { IPrize } from "./Prize";

export interface IBundle extends Document {
  amount: number;
  date: Date;
  value: number;
  printed: boolean;
  amount_validated: number;
  prizes: IPrize["_id"];
  archive_path: string;
  print_date: Date;
}

const BundleSchema: Schema = new Schema({
  amount: {
    type: Number,
  },
  date: {
    type: Date,
  },
  print_date: {
    type: Date,
  },
  value: {
    type: Number,
  },
  printed: {
    type: Boolean,
    default: false,
  },
  amount_validated: {
    type: Number,
    default: 0,
  },
  archive_path: {
    type: String,
  },
  prizes: [
    {
      type: Schema.Types.ObjectId,
      ref: "prize",
      default: [],
    },
  ],
});

export default model<IBundle>("bundle", BundleSchema);
