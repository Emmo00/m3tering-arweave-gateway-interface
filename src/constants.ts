export const ARWEAVE_GATEWAY_URL = process.env.ARWEAVE_GATEWAY_URL as string;
export const ARWEAVE_PEERS = ["https://arweave.net"];
export const MONGODB_URI = process.env.MONGODB_URI as string;

export const PROTOCOL_CONTRACT_ADDRESS = "0x2b3997D82C836bd33C89e20fBaEF96CA99F1B24A";
export const PROTOCOL_CONTRACT_ABI = [
  "function contractByToken(uint256) view returns (string)",
  "function tokenByContract(string) view returns (uint256)",
];

export const M3TER_NFT_CONTRACT_ADDRESS = "0x40a36C0eF29A49D1B1c1fA45fab63762f8FC423F";
export const M3TER_NFT_CONTRACT_ABI = [
  "function totalSupply() view returns (uint256)",
  "function publicKey(uint256) view returns (bytes32)",
];

export const ROLLUP_CONTRACT_ADDRESS = "0x6E31632D6A7Af8d30766AA9E216c49F5AAb846c2";
export const ROLLUP_CONTRACT_ABI = [
  "function nonce(uint256) external view returns (bytes6)",
  "function account(uint256) external view returns (bytes6)",
];
