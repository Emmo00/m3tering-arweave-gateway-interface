import { ethers } from "ethers";
import { PROTOCOL_CONTRACT_ADDRESS, PROTOCOL_CONTRACT_ABI } from "../../constants";

const provider = new ethers.JsonRpcProvider(process.env.GNOSIS_MAINNET_RPC);

const protocolContract = new ethers.Contract(
  PROTOCOL_CONTRACT_ADDRESS,
  PROTOCOL_CONTRACT_ABI,
  provider
);

export async function readContractByToken(tokenId: string): Promise<string> {
  try {
    const result = await protocolContract.contractByToken(tokenId);
    console.log(`Contract for token ${tokenId}:`, result);
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
