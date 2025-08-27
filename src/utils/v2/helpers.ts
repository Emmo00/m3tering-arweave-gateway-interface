import os from "os";
import { MeterDataPointEdge, MeterDataPointEdgeV2, MeterTransactionData } from "../../types";
import { arweaveConfig } from "../../config/arweave";

const MAX_CONCURRENT_REQUESTS = 20;
let activeRequests = 0;
const requestQueue: (() => void)[] = [];

export function buildMeterDataPoint(
  transactionIDToEdgeDataMap: {
    [key: string]: {
      id: string;
      cursor: string;
      blockTimestamp: number;
      tags: any;
    };
  }
): MeterDataPointEdgeV2[] {
  return Object.entries(transactionIDToEdgeDataMap).map(([transactionId, edgeData]) => ({
    cursor: edgeData.cursor,
    node: {
      transactionId,
      meterNumber: edgeData.tags["M3ter-ID"] || null,
      timestamp: edgeData.tags["Timestamp"] || null,
      payload: {
        nonce: edgeData.tags["Nonce"] || null,
        voltage: edgeData.tags["Voltage"] || null,
        energy: edgeData.tags["Energy"] || null,
        longitude: edgeData.tags["Longitude"] || null,
        latitude: edgeData.tags["Latitude"] || null,
        signature: edgeData.tags["Signature"] || null,
      },
    },
  }));
}

/**
 * Makes a request to the Arweave gateway with automatic gateway rotation on failure.
 *
 * @param path The path to the Arweave endpoint, e.g., "/graphql"
 * @param config Request configuration options
 * @returns Promise<Response>
 * @throws Error if the request fails
 */
export async function makeRequestToArweaveNetwork(
  path: string = "/",
  config: RequestInit = {},
  attempt: number = 0,
  maxAttempts: number = 5
): Promise<Response> {
  return enqueue(async () => {
    const url = arweaveConfig.getGatewayUrl() + path;

    process.stdout.write(
      `Making request to Arweave: ${url} with attempt ${attempt + 1}\r`
    );

    try {
      const response = await fetch(url, {
        ...config,
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
      });

      if (
        response.status === 429 ||
        response.status === 503 ||
        response.status === 529 ||
        response.status === 572
      ) {
        process.stdout.write(
          `Request to ${url} failed with status ${response.status}. retrying...\r`
        );
        // wait 10ms and try again
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return await makeRequestToArweaveNetwork(
            path,
            config,
            attempt + 1,
            maxAttempts
          );
        }
        throw new Error(`Max attempts reached for ${url}`);
      }

      return response;
    } catch (error: any) {
      const isTimeout =
        error?.code === "ETIMEDOUT" ||
        error?.message?.includes("fetch failed") ||
        error?.cause?.code === "ETIMEDOUT";

      if (isTimeout) {
        console.error(`Timeout when accessing ${url}. retrying...`);
        // wait 10ms and try again
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2 * attempt)); // Exponential backoff
          return await makeRequestToArweaveNetwork(
            path,
            config,
            attempt + 1,
            maxAttempts
          );
        }
      }

      console.error(`Error making request to Arweave:`, error);
      throw error;
    }
  });
}

// Queue manager
async function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => requestQueue.push(resolve));
  }

  activeRequests++;

  try {
    return await fn();
  } finally {
    activeRequests--;
    if (requestQueue.length > 0) {
      const next = requestQueue.shift();
      if (next) next();
    }
  }
}
