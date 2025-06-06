import {
  ArweaveTransactionsResponseBody,
  MeterDataPointEdge,
  MeterDataPointsResolverArgs,
  MeterTransactionData,
} from "../types";
import {
  buildArweaveTransactionQuery,
  loadTransactionData,
  makeRequestToArweave,
} from "../utils/arweave";
import {
  buildMeterDataPoint,
  transformOldWarpSchemaToNewSchema,
} from "../utils/helpers";
import { getMeterFromMeterNumber } from "../utils/mongo";

export async function meterDataPointResolver(
  _: any,
  args: MeterDataPointsResolverArgs
): Promise<MeterDataPointEdge[]> {
  const { meterNumber, first, after, sortBy } = args;
  let { contractId } = args;
  let meterDataPoints: MeterDataPointEdge[] = [];

  // meterNumber was passed instead of contractId, resolve contractId
  if (!contractId && meterNumber) {
    const meter = await getMeterFromMeterNumber(meterNumber);
    if (!meter) {
      throw new Error(`No meter found with meterNumber: ${meterNumber}`);
    }
    contractId = meter.contractId;
  }

  // build arweave query
  const arweaveQuery = buildArweaveTransactionQuery({
    contractId,
    first,
    after,
    sortBy,
  });

  // get meter data points transactions
  const arweaveResponse =
    await makeRequestToArweave<ArweaveTransactionsResponseBody>(arweaveQuery);

  // transaction id => edge data mapping
  const transactionIDToEdgeDataMap =
    arweaveResponse.data.transactions.edges.reduce((acc: any, edge: any) => {
      const transactionId = edge.node.id;
      const blockTimestamp = edge.node.block.timestamp;
      const tags = edge.node.tags.reduce((acc: any, tag: any) => {
        acc[tag.name] = tag.value;
        return acc;
      }, {});
      const cursor = edge.cursor;
      acc[transactionId] = {
        id: transactionId,
        blockTimestamp,
        cursor,
        tags,
      };
      return acc;
    }, {});

  // extract transaction IDs
  const transactionIds = Object.keys(transactionIDToEdgeDataMap);

  // get transaction data for each transaction ID
  const transactionData = await Promise.all(
    transactionIds.map(async (transactionId) => {
      let response = await loadTransactionData<"meter">(transactionId);

      if (typeof response !== "object") {
        // load and transform transaction data from tags `Input`
        const edgeData = transactionIDToEdgeDataMap[transactionId];
        const inputTag = edgeData.tags["Input"];
        if (!inputTag) {
          console.warn(
            `No input tag found for transaction ID: ${transactionId}`
          );
          return null;
        }

        // transform and parse the input tag
        response = transformOldWarpSchemaToNewSchema(
          inputTag
        ) as MeterTransactionData<"meter">;
      }

      return { response, transactionId };
    })
  );

  // build meter data point from transaction data and edge data
  meterDataPoints = buildMeterDataPoint(
    transactionData,
    transactionIDToEdgeDataMap
  );

  console.log("meterDataPoints", meterDataPoints);

  return meterDataPoints;
}
