import {  MeterDataPointEdgeV2 } from "../../types";

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
