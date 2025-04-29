import { ARWEAVE_GATEWAY_URL } from "../constants";

export const testConnectionToArweaveGateway = async () => {
  try {
    const response = await fetch(ARWEAVE_GATEWAY_URL);

    if (!response.ok) {
      throw new Error("Failed to connect to Arweave");
    }

    const data = await response.json();
    console.log("Connected to Arweave:", data);
  } catch (error) {
    console.error("Error connecting to Arweave:", error);
  }
};