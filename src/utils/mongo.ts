import { MeterModel } from "../models/Meter";
import { Meter } from "../types";

export async function getMeterFromMeterNumber(
  meterNumber: string
): Promise<Meter | null> {
  const meter = await MeterModel.findOne({ meterNumber }).exec();
  if (!meter) {
    console.error(`No meter found with meterNumber: ${meterNumber}`);
    return null;
  }

  return {
    meterNumber: meter.meterNumber,
    contractId: meter.contractId,
    state: meter.state,
  };
}

export async function getMeterFromContractId(
  contractId: string
): Promise<Meter | null> {
  const meter = await MeterModel.findOne({ contractId }).exec();
  if (!meter) {
    console.error(`No meter found with contractId: ${contractId}`);
    return null;
  }

  return {
    meterNumber: meter.meterNumber,
    contractId: meter.contractId,
    state: meter.state,
  };
}

export async function getAllMeters(): Promise<Meter[]> {
  const meters = await MeterModel.find({}).exec();
  if (!meters || meters.length === 0) {
    console.error("No meters found in the database");
    return [];
  }

  return meters.map((meter) => ({
    meterNumber: meter.meterNumber,
    contractId: meter.contractId,
    state: meter.state,
  }));
}
