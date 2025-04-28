import { Meter, MeterResolverArgs } from "../types";
import {
  getMeterFromContractId,
  getMeterFromMeterNumber,
} from "../utils/arweave";

export function metersResolver(): Meter[] {
  return [];
}

export function meterResolver(_: any, args: MeterResolverArgs): Meter | null {
  const { meterNumber, contractId } = args;
  let meter = null;

  if (meterNumber) {
    meter = getMeterFromMeterNumber(meterNumber);
  } else if (contractId) {
    meter = getMeterFromContractId(contractId);
  } else {
    throw new Error("Either meterNumber or contractId must be provided");
  }

  return meter;
}
