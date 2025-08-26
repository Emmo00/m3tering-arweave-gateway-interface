import { ethers } from "ethers";
import { MeterResolverArgsV2, MeterV2 } from "../../types";
import { getCummulativeEnergy, getPublicKey } from "../../utils/v2/blockchain";
import { getAllMeters, getMeterFromMeterNumber, saveMeter } from "../../utils/v2/mongo";

const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

export async function metersResolver(): Promise<MeterV2[]> {
  // get meters from database
  return (await getAllMeters()).sort((a, b) => b.meterNumber - a.meterNumber);
}

export async function meterResolver(_: any, args: MeterResolverArgsV2): Promise<MeterV2 | null> {
  const { meterNumber } = args;
  let meter: MeterV2 | null = await getMeterFromMeterNumber(meterNumber);

  if (!meter) {
    console.error(`No meter found with meterNumber: ${meterNumber}. Searching onchain...`);

    // If not found in DB, try to find onchain
    const publicKey = await getPublicKey(meterNumber);
    if (!publicKey || publicKey === ZERO_BYTES32) {
      console.error(`No public key found onchain for meterNumber: ${meterNumber}`);
      return null;
    }

    const totalEnergy = await getCummulativeEnergy(meterNumber);

    meter = await saveMeter({
      meterNumber,
      publicKey,
      totalEnergy,
    });
  }

  return meter;
}
