import { ethers } from "ethers";
import { MeterResolverArgsV2, MeterV2 } from "../../types";
import { getCummulativeEnergy, getNFTTotalSupply, getPublicKey } from "../../utils/v2/blockchain";
import { getAllMeters, getMeterFromMeterNumber, saveMeter } from "../../utils/v2/mongo";

async function getMeterData(meterNumber: number): Promise<MeterV2 | null> {
  try {
    const publicKey = await getPublicKey(meterNumber);
    const totalEnergy = await getCummulativeEnergy(meterNumber);

    return {
      meterNumber,
      publicKey,
      totalEnergy,
    };
  } catch (error) {
    console.error(`Error fetching data for meter ${meterNumber}:`, error);
    return null;
  }
}

export async function metersResolver(): Promise<MeterV2[]> {
  const nftTokenSupply = await getNFTTotalSupply();

  const meters = [];

  for (let i = 0; i < nftTokenSupply; i++) {
    meters.push(getMeterData(i));
  }

  return Promise.all(meters);
}

export async function meterResolver(_: any, args: MeterResolverArgsV2): Promise<MeterV2 | null> {
  const { meterNumber } = args;
  return getMeterData(meterNumber);
}
