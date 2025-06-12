import { ethers } from "ethers";
import { PROTOCOL_CONTRACT_ADDRESS, PROTOCOL_CONTRACT_ABI } from "../constants";

const provider = new ethers.JsonRpcProvider(
  "https://gnosis-mainnet.public.blastapi.io"
);
const protocolContract = new ethers.Contract(
  PROTOCOL_CONTRACT_ADDRESS,
  PROTOCOL_CONTRACT_ABI,
  provider
);

export async function readContractByToken(tokenAddress: number): Promise<string> {
  try {
    const result = await protocolContract.contractByToken(tokenAddress);
    console.log(`Contract for token ${tokenAddress}:`, result);
    return result;
  } catch (error) {
    console.error("Error reading contract:", error);
    throw error; // Re-throw the error
  }
}

export async function readTokenByContract(contractAddress: string): Promise<bigint> {
  try {
    const result = await protocolContract.tokenByContract(contractAddress);
    console.log(`Token for contract ${contractAddress}:`, result);
    return result;
  } catch (error) {
    console.error("Error reading token:", error);
    throw error; // Re-throw the error
  }
}
