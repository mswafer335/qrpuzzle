import { model, Schema, Model, Document, ObjectId } from "mongoose";

export interface IAdmin extends Document {
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  phone: string;
  password: string;
}

const AdminSchema = new Schema({
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
  password: {
    type: String,
  },
});

export default model<IAdmin>("admin", AdminSchema);
