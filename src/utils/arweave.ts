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

export function buildArweaveQueryForContractId({
  exclude,
  after = null,
}: {
  exclude: string[];
  after?: string | null;
}) {
  return `{
        transactions(
            first: 1
            sort: HEIGHT_DESC
            tags: [
                { name: "Contract-Use", values: ["M3tering Protocol"] },
                { name: "Bundle-Format", values: ["binary", "json"], op: NEQ }
            ${
              exclude.length > 0
                ? `
                {
                  name: "Contract"
                  values: ["${exclude.join('", "')}", ]
                  op: NEQ
                }
                  `
                : ""
            }
                ]
            after: "${after || ""}"
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

export async function loadTransactionData<
  functionName extends "meter" | "initial"
>(transactionId: string): Promise<MeterTransactionData<functionName>> {
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

export async function getMeterCurrentState(contractId: string) {
  const meterState = (await warp.contract(contractId).readState()).cachedValue
    .state;

  console.log("Meter state:", meterState);

  return meterState;
}
