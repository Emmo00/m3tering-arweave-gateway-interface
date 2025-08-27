import { ethers } from 'ethers';
import { MeterResolverArgsV2, MeterV2 } from '../../types';
import { getCummulativeEnergy, getNFTTotalSupply, getPublicKey } from '../../utils/v2/blockchain';
import { getAllMeters, getMeterFromMeterNumber, saveMeter } from '../../utils/v2/mongo';

async function getMeterData(meterNumber: number): Promise<MeterV2 | null> {
  const nftTokenSupply = await getNFTTotalSupply();

  if (meterNumber >= nftTokenSupply) {
    console.error(`Invalid meterNumber: ${meterNumber}`);
    return null;
  }

  // try to find the meter in the database
  const meter = await getMeterFromMeterNumber(meterNumber);
  if (meter) {
    return meter;
  }

  const publicKey = await getPublicKey(meterNumber);

  return await saveMeter({
    meterNumber,
    publicKey,
  });
}

export async function metersResolver(): Promise<MeterV2[]> {
  const nftTokenSupply = await getNFTTotalSupply();
  const meters = [];

  for (let i = 0; i < nftTokenSupply; i++) {
    meters.push(getMeterData(i));
  }

  return (async () =>
    (await Promise.all<MeterV2[]>(meters)).sort((a, b) => a.meterNumber - b.meterNumber))();
}

export async function meterResolver(_: any, args: MeterResolverArgsV2): Promise<MeterV2 | null> {
  const { meterNumber } = args;
  return getMeterData(meterNumber);
}
