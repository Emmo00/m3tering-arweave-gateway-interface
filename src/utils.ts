import { ARWEAVE_GATEWAY_URL } from "./constants";
import {
  ArweaveResponseBody,
  BuildArweaveTransactionQueryConfig,
  MeterDataPoint,
  MeterTransactionData,
} from "./types";

export function buildArweaveTransactionQuery({
  contractId,
  first,
  after,
}: BuildArweaveTransactionQueryConfig): string {
  return `{
        transactions(
            first: ${first || 10}
            sort: HEIGHT_DESC
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
                }
            }
        }
    }`;
}

export async function makeRequestToArweave<T>(query: string): Promise<T> {
  try {
    const response = await fetch(ARWEAVE_GATEWAY_URL, {
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
    const response = await fetch(
      `${ARWEAVE_GATEWAY_URL}/tx/${transactionId}/data`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

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

export function buildMeterDataPoint(
    transactionData: {
        transactionId: string;
        response: MeterTransactionData<"meter">;
    }[],
    transactionIDToEdgeDataMap: { [key: string]: ArweaveResponseBody }
): MeterDataPoint[] {
    return transactionData.map(({ transactionId, response }) => {
        const edgeData = transactionIDToEdgeDataMap[transactionId];

        if (!edgeData) {
            console.warn(`No edge data found for transaction ID: ${transactionId}`);
            return null;
        }

        return {
            transactionId,
            timestamp: edgeData.block.timestamp,
            meterValue: response.meterValue,
            metadata: response.metadata,
        };
    }).filter((dataPoint): dataPoint is MeterDataPoint => dataPoint !== null);
}
