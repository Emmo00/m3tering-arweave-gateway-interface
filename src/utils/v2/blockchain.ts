import { ethers } from 'ethers';
import {
  M3TER_NFT_CONTRACT_ABI,
  M3TER_NFT_CONTRACT_ADDRESS as M3TER_NFT_CONTRACT,
  ROLLUP_CONTRACT_ABI,
  ROLLUP_CONTRACT_ADDRESS,
} from '../../constants';

const provider = new ethers.JsonRpcProvider(process.env.ETH_MAINNET_RPC);

const m3terNftContract = new ethers.Contract(M3TER_NFT_CONTRACT, M3TER_NFT_CONTRACT_ABI, provider);

const rollupContract = new ethers.Contract(ROLLUP_CONTRACT_ADDRESS, ROLLUP_CONTRACT_ABI, provider);

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

export async function getPublicKey(tokenId: number): Promise<string> {
  try {
    const result = await m3terNftContract.publicKey(tokenId);
    console.log(`Public key for token ${tokenId}:`, result);
    return result === ZERO_BYTES32 ? '' : result;
  } catch (error) {
    console.error('Error reading public key:', error);
    throw error; // Re-throw the error
  }
}

export async function getNFTTotalSupply() {
  try {
    const totalSupply = await m3terNftContract.totalSupply();
    return totalSupply;
  } catch (error) {
    console.error('Error getting NFT total supply:', error);
    throw error;
  }
}

export async function checkNonceOnchain(meterId: number): Promise<number> {
  try {
    const nonce = await rollupContract.nonce(meterId);
    return nonce;
  } catch (err: any) {
    console.error('Failed to check nonce onchain:', err);
    throw err;
  }
}

export async function getCummulativeEnergy(meterId: number): Promise<number> {
  try {
    const energy = await rollupContract.account(meterId);
    return energy;
  } catch (err: any) {
    console.error('Failed to get cummulative energy:', err);
    throw err;
  }
}
