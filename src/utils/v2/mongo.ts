import { MeterModelV2 } from "../../models/MeterV2";
import { MeterV2 } from "../../types";

export async function getMeterFromMeterNumber(
  meterNumber: number
): Promise<MeterV2 | null> {
  const meter = await MeterModelV2.findOne({ meterNumber }).exec();
  if (!meter) {
    console.error(`No meter found with meterNumber: ${meterNumber}`);
    return null;
  }

  return meter;
}

export async function saveMeter({ meterNumber, publicKey }: MeterV2) {
  const meter = await MeterModelV2.create({
    meterNumber,
    publicKey,
  })

  return meter;
}

export async function getAllMeters(): Promise<MeterV2[]> {
  const meters = await MeterModelV2.find({}).exec();
  if (!meters || meters.length === 0) {
    console.error("No meters found in the database");
    return [];
  }

  return meters
}
