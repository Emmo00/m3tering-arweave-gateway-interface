import {
  ArweaveTransactionEdge,
  ArweaveTransactionsResponseBody,
  MeterDataPointEdge,
  MeterDataPointsResolverArgs,
  MeterTransactionData,
} from '../../types';
import { makeRequestToArweave } from '../../utils/arweave';
import { buildArweaveTransactionQuery, loadTransactionData } from '../../utils/v1/arweave';
import { buildMeterDataPoint, transformOldWarpSchemaToNewSchema } from '../../utils/v1/helpers';
import { getMeterFromContractId, getMeterFromMeterNumber } from '../../utils/v1/mongo';

export async function meterDataPointResolver(
  _: any,
  args: MeterDataPointsResolverArgs,
): Promise<MeterDataPointEdge[]> {
  console.log('Starting meterDataPointResolver with args:', args);
  const { first, after, sortBy } = args;
  let { contractId, meterNumber } = args;
  let meterDataPoints: MeterDataPointEdge[] = [];

  // meterNumber was passed instead of contractId, resolve contractId
  if (!contractId && meterNumber) {
    const meter = await getMeterFromMeterNumber(meterNumber);
    if (!meter) {
      throw new Error(`No meter found with meterNumber: ${meterNumber}`);
    }

    contractId = meter.contractId;
  } else {
    const meter = await getMeterFromContractId(contractId);

    if (!meter) {
      throw new Error(`No meter found with contract ID: ${contractId}`);
    }

    meterNumber = meter.meterNumber;
  }

  // get transactions based on query
  const transactionsFromQuery = await getTransactionsFromQuery({
    contractId,
    first: first ?? 10,
    after,
    sortBy,
  });

  // transaction id => edge data mapping
  const transactionIDToEdgeDataMap = transactionsFromQuery.reduce((acc: any, edge: any) => {
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
      let response = await loadTransactionData<'meter'>(transactionId);

      if (typeof response !== 'object') {
        // load and transform transaction data from tags `Input`
        const edgeData = transactionIDToEdgeDataMap[transactionId];
        const inputTag = edgeData.tags['Input'];
        if (!inputTag) {
          console.warn(`No input tag found for transaction ID: ${transactionId}`);
          return null;
        }

        // transform and parse the input tag
        response = transformOldWarpSchemaToNewSchema(inputTag) as MeterTransactionData<'meter'>;
      }

      return { response, transactionId };
    }),
  );

  // build meter data point from transaction data and edge data
  meterDataPoints = buildMeterDataPoint(
    meterNumber,
    contractId,
    transactionData,
    transactionIDToEdgeDataMap,
  );

  return meterDataPoints;
}

async function getTransactionsFromQuery({ contractId, first, after, sortBy }) {
  let transactions: ArweaveTransactionEdge[] = [];
  const max_response_count = 100;

  for (let i = 0; i < first; ) {
    const remaining = first - i;
    const batchSize = remaining > max_response_count ? max_response_count : remaining;

    const query = buildArweaveTransactionQuery({
      contractId,
      first: batchSize,
      after,
      sortBy,
    });

    const response = await makeRequestToArweave<ArweaveTransactionsResponseBody>(query);
    const edges = response.data.transactions.edges;
    const nbNewTransactions = edges.length;

    if (nbNewTransactions === 0) {
      console.warn('No new transactions received. Breaking out to avoid infinite loop.');
      break;
    }

    transactions = [...transactions, ...edges];
    i += nbNewTransactions;
    after = edges[nbNewTransactions - 1].cursor;
  }

  return transactions;
}
