import { model, Schema, Model, Document, ObjectId } from "mongoose";
import { IPrize } from "./Prize";

export interface IQR extends Document {
  validated: boolean;
  prize: IPrize['_id'];
  url: string;
  code: string;
}

const QRSchema = new Schema({
  validated: {
    type: Boolean,
    default: false,
  },
  prize: {
    type: Schema.Types.ObjectId,
    ref: "prize",
  },
  code: {
    type: String,
  },
  url: {
    type: String,
  },
});

const QR = model<IQR>("qr", QRSchema);
export default QR;
