import {
  ArweaveTransactionEdge,
  ArweaveTransactionsResponseBody,
  BuildArweaveTransactionQueryConfigV2,
  MeterDataPointEdgeV2,
  MeterDataPointsResolverArgsV2,
} from '../../types';
import { makeRequestToArweave } from '../../utils/arweave';
import { buildArweaveTransactionQuery } from '../../utils/v2/arweave';
import { buildMeterDataPoint } from '../../utils/v2/helpers';

export async function meterDataPointResolver(
  _: any,
  args: MeterDataPointsResolverArgsV2,
): Promise<MeterDataPointEdgeV2[]> {
  console.log('Starting meterDataPointResolver with args:', args);
  const { first, after, sortBy, nonces, block } = args;
  let { meterNumber } = args;
  let meterDataPoints: MeterDataPointEdgeV2[] = [];

  // get transactions based on query
  const transactionsFromQuery = await getTransactionsFromQuery({
    meterNumber,
    first: first ?? nonces?.length ?? 10,
    after,
    sortBy,
    nonces,
    block,
  });

  // transaction id => edge data mapping
  const transactionIDToEdgeDataMap = transactionsFromQuery.reduce((acc: any, edge: any) => {
    const transactionId = edge.node.id;
    const tags = edge.node.tags.reduce((acc: any, tag: any) => {
      acc[tag.name] = tag.value;
      return acc;
    }, {});

    const cursor = edge.cursor;
    acc[transactionId] = {
      id: transactionId,
      cursor,
      tags,
    };
    return acc;
  }, {});

  // build meter data point from transaction data and edge data
  meterDataPoints = buildMeterDataPoint(transactionIDToEdgeDataMap);

  return meterDataPoints;
}

async function getTransactionsFromQuery({
  meterNumber,
  first,
  after,
  sortBy,
  nonces,
  block,
}: BuildArweaveTransactionQueryConfigV2): Promise<ArweaveTransactionEdge[]> {
  let transactions: ArweaveTransactionEdge[] = [];
  const max_response_count = 100;

  for (let i = 0; i < first; ) {
    const remaining = first - i;
    const batchSize = remaining > max_response_count ? max_response_count : remaining;

    const query = buildArweaveTransactionQuery({
      meterNumber,
      first: batchSize,
      after,
      sortBy,
      nonces,
      block,
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
