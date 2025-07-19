import os from "os";
import { MeterDataPointEdge, MeterTransactionData } from "../types";
import { arweaveConfig } from "../config/arweave";

const MAX_CONCURRENT_REQUESTS = 20;
let activeRequests = 0;
const requestQueue: (() => void)[] = [];

export function buildMeterDataPoint(
  meterNumber_: string,
  contractId_: string,
  transactionData: {
    transactionId: string;
    response: MeterTransactionData<"meter">;
  }[],
  transactionIDToEdgeDataMap: {
    [key: string]: {
      id: string;
      cursor: string;
      blockTimestamp: number;
      tags: any;
    };
  }
): MeterDataPointEdge[] {
  return transactionData
    .map(({ transactionId, response }) => {
      const edgeData = transactionIDToEdgeDataMap[transactionId];

      if (!edgeData) {
        console.warn(`No edge data found for transaction ID: ${transactionId}`);
        return null;
      }

      if (typeof response !== "object") {
        console.warn(
          `Invalid response for transaction ID: ${transactionId}, expected object but got ${typeof response}`
        );
        return null;
      }
      if (!response.input || !response.input.payload) {
        console.warn(
          `Invalid response structure for transaction ID: ${transactionId}`
        );
        return null;
      }

      if (response.input.payload.length !== 3) {
        console.warn(
          `Invalid payload length for transaction ID: ${transactionId}, expected 3 but got ${response.input.payload.length}`
        );
        return null;
      }

      const [nonce, voltage, current, energy] = JSON.parse(
        response.input.payload[0]
      );

      const contractId = edgeData.tags["Contract"] || contractId_ || null;

      return {
        cursor: edgeData.cursor,
        node: {
          transactionId,
          meterNumber: meterNumber_,
          contractId,
          timestamp: edgeData.blockTimestamp,
          payload: {
            nonce,
            voltage,
            current,
            energy,
            signature: response.input.payload[1],
            publicKey: response.input.payload[2],
          },
        },
      } as unknown as MeterDataPointEdge;
    })
    .filter((dataPoint) => dataPoint !== null);
}

export function transformOldWarpSchemaToNewSchema(transactionData: string) {
  /* 
    OLD:
    {\"data\":[\"signature\",\"publicKey\",[nonce,voltage,current]],\"function\":\"meter\"}
  */
  /* 
    NEW:
    {
      input: {
        payload: ["[nonce,voltage,current, energy]", "signature", "publicKey"],
        function: \"meter\"
      }
    }
  */
  const parsedData = JSON.parse(transactionData);
  const { data, function: func } = parsedData;
  const [signature, publicKey, payload] = data;
  const [nonce, voltage, current, energy = 0] = payload;
  const newSchema = {
    input: {
      payload: [
        JSON.stringify([nonce, voltage, current, energy]),
        signature,
        publicKey,
      ],
      function: func,
    },
  };
  console.log("newSchema", newSchema);
  return newSchema;
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
