import { Meter, MeterResolverArgs } from '../../types';
import {
  getAllMeters,
  getMeterFromContractId,
  getMeterFromMeterNumber,
} from '../../utils/v1/mongo';

export async function metersResolver(): Promise<Meter[]> {
  // get meters from database
  return (await getAllMeters()).sort((a, b) => parseInt(b.meterNumber) - parseInt(a.meterNumber));
}

export async function meterResolver(_: any, args: MeterResolverArgs): Promise<Meter | null> {
  const { meterNumber, contractId } = args;
  let meter: Meter | null = null;

  if (contractId) {
    meter = await getMeterFromContractId(contractId);
  } else if (meterNumber) {
    meter = await getMeterFromMeterNumber(meterNumber);
  } else {
    throw new Error('Either meterNumber or contractId must be provided');
  }

  return meter;
}
