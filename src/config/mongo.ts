import mongoose from "mongoose";
import { MONGODB_URI } from "../constants";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error while connecting to database: `, error);
    process.exit(1);
  }
};
