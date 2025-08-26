import mongoose from "mongoose";
import { MeterV2 } from "../types";

const MeterSchema = new mongoose.Schema({
  meterNumber: Number,
  publicKey: String,
  totalEnergy: { type: Number, default: 0 }
});

export const MeterModelV2 = mongoose.model<MeterV2>("MeterV2", MeterSchema);
