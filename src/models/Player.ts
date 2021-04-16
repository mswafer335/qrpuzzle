import { model, Schema, Model, Document, ObjectId } from "mongoose";
import { IPrize } from "./Prize";

export interface IPlayer extends Document {
  firstname: string,
  lastname: string,
  fullname: string,
  email: string,
  phone: string,
  prizes: IPrize["_id"],
}

const PlayerSchema = new Schema({
  firstname: {
    type: String
  },
  lastname: {
    type: String
  },
  fullname: {
    type: String
  },
  email: {
    type: String
  },
  phone: {
    type: String
  },
  prizes: [{
    type:Schema.Types.ObjectId,
    ref: "prize",
    default: []
  }]
});

const Player = model<IPlayer>("player", PlayerSchema);
export default Player;
