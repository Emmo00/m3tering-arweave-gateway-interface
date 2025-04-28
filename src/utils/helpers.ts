import {
  MeterDataPointEdge,
  MeterTransactionData,
} from "../types";

export function buildMeterDataPoint(
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

      const [nonce, voltage, current, energy] = JSON.parse(
        response.input.payload[0]
      );

      const contractId = edgeData.tags["Contract"] || null;

      return {
        cursor: edgeData.cursor,
        node: {
          transactionId,
          meterNumber: null,
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
