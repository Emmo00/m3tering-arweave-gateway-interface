import mongoose from "mongoose";

export const ARWEAVE_GATEWAY_URL = process.env.ARWEAVE_GATEWAY_URL as string;
export const MONGODB_URI = process.env.MONGODB_URI as string;

const MeterSchema = new mongoose.Schema({
  contractId: String,
  meterNumber: String,
  state: {
    type: Object,
    default: {},
  },
});

export const MeterModel = mongoose.model("Meter", MeterSchema);
