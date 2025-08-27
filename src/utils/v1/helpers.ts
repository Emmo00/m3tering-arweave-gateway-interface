import { MeterDataPointEdge, MeterTransactionData } from '../../types';

export function buildMeterDataPoint(
  meterNumber_: string,
  contractId_: string,
  transactionData: {
    transactionId: string;
    response: MeterTransactionData<'meter'>;
  }[],
  transactionIDToEdgeDataMap: {
    [key: string]: {
      id: string;
      cursor: string;
      blockTimestamp: number;
      tags: any;
    };
  },
): MeterDataPointEdge[] {
  return transactionData
    .map(({ transactionId, response }) => {
      const edgeData = transactionIDToEdgeDataMap[transactionId];

      if (!edgeData) {
        console.warn(`No edge data found for transaction ID: ${transactionId}`);
        return null;
      }

      if (typeof response !== 'object') {
        console.warn(
          `Invalid response for transaction ID: ${transactionId}, expected object but got ${typeof response}`,
        );
        return null;
      }
      if (!response.input || !response.input.payload) {
        console.warn(`Invalid response structure for transaction ID: ${transactionId}`);
        return null;
      }

      if (response.input.payload.length !== 3) {
        console.warn(
          `Invalid payload length for transaction ID: ${transactionId}, expected 3 but got ${response.input.payload.length}`,
        );
        return null;
      }

      const [nonce, voltage, current, energy] = JSON.parse(response.input.payload[0]);

      const contractId = edgeData.tags['Contract'] || contractId_ || null;

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
      payload: [JSON.stringify([nonce, voltage, current, energy]), signature, publicKey],
      function: func,
    },
  };
  console.log('newSchema', newSchema);
  return newSchema;
}
