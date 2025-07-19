import { warp } from "../config/warp";
import {
  BuildArweaveTransactionQueryConfig,
  MeterTransactionData,
} from "../types";
import { makeRequestToArweaveNetwork } from "./helpers";

// Simple in-memory cache with expiration and size limit
type CacheEntry<T> = { value: T; expiresAt: number };
const CACHE_MAX_ENTRIES = 1000;
const cache = new Map<string, CacheEntry<any>>();

function setCache<T>(key: string, value: T, ttlMs: number) {
  // Clean up if over limit
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Remove oldest entry
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function getCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export const testConnectionToArweaveGateway = async () => {
  try {
    const response = await makeRequestToArweaveNetwork();

    if (!response.ok) {
      throw new Error("Failed to connect to Arweave");
    }

    const data = await response.json();
    console.log("Connected to Arweave:", data);
  } catch (error) {
    console.error("Error connecting to Arweave:", error);
    throw error;
  }
};

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

export async function makeRequestToArweave<T>(query: string): Promise<T> {
  // Determine if this is a MeterDataPoint resolver query and extract sortBy
  let sortBy: string | undefined;
  try {
    // crude extraction of sort: ... from query string
    const sortMatch = query.match(/sort:\s*([A-Z_]+)/);
    if (sortMatch) sortBy = sortMatch[1];
  } catch {}
  // Only cache for HEIGHT_ASC or HEIGHT_DESC
  let cacheKey: string | undefined;
  let cacheTtl: number | undefined;
  cacheKey = `MeterDataPoint:${sortBy}:${query}`;
  cacheTtl = 24 * 60 * 60 * 1000; // 1 day
  
  if (cacheKey) {
    const cached = getCache<T>(cacheKey);
    if (cached) return cached;
  }
  try {
    const response = await makeRequestToArweaveNetwork("/graphql", {
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
    if (cacheKey && cacheTtl) setCache(cacheKey, data as T, cacheTtl);
    return data as T;
  } catch (error) {
    console.error("Error making request to Arweave:", error);
    throw error;
  }
}

export async function loadTransactionData<
  functionName extends "meter" | "initial"
>(transactionId: string): Promise<MeterTransactionData<functionName>> {
  const cacheKey = `TransactionData:${transactionId}`;
  const cacheTtl = 24 * 60 * 60 * 1000; // 1 day
  const cached = getCache<MeterTransactionData<functionName>>(cacheKey);
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
    setCache(cacheKey, data as MeterTransactionData<functionName>, cacheTtl);
    return data as MeterTransactionData<functionName>;
  } catch (error) {
    console.error("Error loading transaction data from Arweave:", error);
    throw error;
  }
}

export async function getMeterCurrentState(contractId: string) {
  console.log("Getting state for", contractId);
  const meterState = (await warp.contract(contractId).readState()).cachedValue
    .state;

  console.log("Meter state:", meterState);

  return meterState;
}
