import { warp } from "../../config/warp";
import { BuildArweaveTransactionQueryConfig, MeterTransactionData } from "../../types";
import {
  makeRequestToArweaveNetwork,
  getCache as getArweaveRequestCache,
  setCache as setArweaveRequestCache,
} from "../arweave";

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
            sort: HEIGHT_ASC
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

export async function loadTransactionData<functionName extends "meter" | "initial">(
  transactionId: string
): Promise<MeterTransactionData<functionName>> {
  const cacheKey = `TransactionData:${transactionId}`;
  const cacheTtl = 24 * 60 * 60 * 1000; // 1 day
  const cached = getArweaveRequestCache<MeterTransactionData<functionName>>(cacheKey);
  if (cached) return cached;
  // ...existing code...
  try {
    const response = await makeRequestToArweaveNetwork(`/${transactionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setArweaveRequestCache(cacheKey, data as MeterTransactionData<functionName>, cacheTtl);
    return data as MeterTransactionData<functionName>;
  } catch (error) {
    console.error("Error loading transaction data from Arweave:", error);
    throw error;
  }
}

export async function getMeterCurrentState(contractId: string) {
  console.log("Getting state for", contractId);
  const meterState = (await warp.contract(contractId).readState()).cachedValue.state;

  console.log("Meter state:", meterState);

  return meterState;
}
