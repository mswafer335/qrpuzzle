import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();
const db = process.env.MONGOURI;

export async function connectDB() {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
