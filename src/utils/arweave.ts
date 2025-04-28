import { ARWEAVE_GATEWAY_URL } from "../constants";
import { warp } from "../config/warp";
import {
  BuildArweaveTransactionQueryConfig,
  MeterTransactionData,
} from "../types";

export function buildArweaveTransactionQuery({
  contractId,
  first,
  after,
  sortBy,
}: BuildArweaveTransactionQueryConfig): string {
  return `{
        transactions(
            first: ${first || 10}
            sort: ${sortBy || "HEIGHT_DESC"}
            after: "${after || ""}"
            tags: [
                { name: "Contract-Use", values: ["M3tering Protocol"] },
                { name: "Bundle-Format", values: ["binary", "json"], op: NEQ }
            ${
              contractId
                ? `
                {
                    name: "Contract"
                    values: ["${contractId}"]
                }
                    `
                : ""
            }
            ]
        ) {
            edges {
                cursor
                node {
                    id
                    block {
                        timestamp
                    }
                    tags {
                        name
                        value
                    }
                }
            }
        }
    }`;
}

export async function makeRequestToArweave<T>(query: string): Promise<T> {
  try {
    const response = await fetch(`${ARWEAVE_GATEWAY_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error("Error making request to Arweave:", error);
    throw error;
  }
}

export async function loadTransactionData<functionName>(
  transactionId: string
): Promise<MeterTransactionData<functionName>> {
  try {
    const response = await fetch(`${ARWEAVE_GATEWAY_URL}/${transactionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as MeterTransactionData<functionName>;
  } catch (error) {
    console.error("Error loading transaction data from Arweave:", error);
    throw error;
  }
}

export async function getMeterFromMeterNumber(meterNumber: string) {
  // TODO: implement this function
  // This function should resolve the contractId from the meterNumber
  // and return the contractId and the initial state of the meter
}

export async function getMeterFromContractId(contractId: string) {
  const meterState = (await warp.contract(contractId).readState(1650336)).cachedValue
    .state;

  console.log("Meter state:", meterState);

  return meterState;
}
