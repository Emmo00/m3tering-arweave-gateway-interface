import {
  ArweaveResponseBody,
  MeterDataPointEdge,
  MeterDataPointsResolverArgs,
} from "../types";
import {
  buildArweaveTransactionQuery,
  loadTransactionData,
  makeRequestToArweave,
} from "../utils/arweave";
import { buildMeterDataPoint } from "../utils/helpers";

export async function meterDataPointResolver(
  _: any,
  args: MeterDataPointsResolverArgs
): Promise<MeterDataPointEdge[]> {
  const { meterNumber, contractId, first, after, sortBy } = args;
  let meterDataPoints: MeterDataPointEdge[] = [];

  // TODO: if meterNumber was passed instead of contractId, resolve contractId

  // build arweave query
  const arweaveQuery = buildArweaveTransactionQuery({
    contractId,
    first,
    after,
    sortBy,
  });

  // get meter data points transactions
  const arweaveResponse = await makeRequestToArweave<ArweaveResponseBody>(
    arweaveQuery
  );

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
      const response = await loadTransactionData<"meter">(transactionId);

      return { response, transactionId };
    })
  );

  // build meter data point from transaction data and edge data
  meterDataPoints = buildMeterDataPoint(
    transactionData,
    transactionIDToEdgeDataMap
  );

  return meterDataPoints;
}
