import { MeterModel } from "../models/Meter";
import { ArweaveTransactionsResponseBody } from "../types";
import {
  buildArweaveQueryForContractId,
  getMeterCurrentState,
  loadTransactionData,
  makeRequestToArweave,
} from "./arweave";
import { readTokenByContract, readContractByToken } from "./blockchain";
import { SyncDump } from "../models/SyncDump";

export async function fetchAndStoreMeters() {
  let afterCursor: string | null =
    (await SyncDump.getLastAfterCursor()) || null;
  let dublicateContractIds: string[] = await SyncDump.getSeenContractIds();

  // while there are more contractIDs to handle
  while (true) {
    // get meters' contract ID already stored in the database
    const storedContractIds = (
      await MeterModel.find({}, { contractId: 1 })
    ).map((meter) => meter.contractId);
    // fetch one transaction from arweave that doesnt have already stored contractID
    const query = buildArweaveQueryForContractId({
      exclude: [...storedContractIds, ...dublicateContractIds],
      after: afterCursor,
    });

    const arweaveResponse =
      await makeRequestToArweave<ArweaveTransactionsResponseBody>(query);
    const transactionEdges = arweaveResponse.data.transactions.edges;
    if (transactionEdges.length === 0) {
      // no more transactions to process
      break;
    }
    const transaction = transactionEdges[0].node;
    const tags = transaction.tags.reduce((acc, tag) => {
      acc[tag.name] = tag.value;
      return acc;
    }, {} as Record<string, string>);

    const contractId = tags["Contract"];

    if (!contractId) {
      // if no contract ID found in the transaction tags
      afterCursor = transactionEdges[0].cursor;
      await SyncDump.setLastAfterCursor(afterCursor);
      console.error(
        `No contract ID found in transaction[${transaction.id}] tags`
      );
      continue;
    }

    // check if contract ID is on the blockchain
    let tokenForContract = (await readTokenByContract(contractId)).toString();
    let contractIdForToken = await readContractByToken(tokenForContract);

    if (
      tokenForContract === "0" || // if token is not found
      contractIdForToken !== contractId // or if contract ID does not match the one from the transaction
    ) {
      afterCursor = transactionEdges[0].cursor;
      await SyncDump.setLastAfterCursor(afterCursor);
      dublicateContractIds.push(contractId);
      await SyncDump.addSeenContractId(contractId);
      console.error(
        `Contract ID ${contractId} not found on the blockchain, skipping`
      );
      continue;
    }

    // fetch the initial state for the contract
    const contractInitialState = await loadTransactionData<"initial">(
      contractId
    );

    // store the contract ID and initial in the database synchronously
    await new MeterModel({
      contractId,
      meterNumber: contractInitialState.token_id,
      state: contractInitialState,
    }).save();

    console.log("saved meter for contractId:", contractId);
  }

  // get meters' contract ID already stored in the database
  const storedContractIds = (await MeterModel.find({}, { contractId: 1 })).map(
    (meter) => meter.contractId
  );

  console.log("storedContractIds", storedContractIds);
}

export async function updateMetersState() {
  // get meters' contract ID already stored in the database
  const storedMeters = await MeterModel.find({}, { contractId: 1, state: 1 });
  const numberOfMeters = storedMeters.length;
  let numberOfMetersSynced = 0;

  for (const meter of storedMeters) {
    const { contractId } = meter;

    // fetch the current state for the contract
    let currentState;

    try {
      currentState = await getMeterCurrentState(contractId);

      if (!currentState) {
        console.error(`No current state found for contract ID: ${contractId}`);
        continue;
      }

      numberOfMetersSynced++;
    } catch (error) {
      console.log(error);
      continue;
    }

    // update the state in the database
    await MeterModel.updateOne(
      { contractId },
      { $set: { state: currentState } }
    );
    console.log(
      `Updated state for contract ID: ${contractId}, new state: ${JSON.stringify(
        currentState
      )}`
    );
  }

  if (numberOfMeters !== numberOfMetersSynced) {
    throw new Error(
      `Number of meters is ${numberOfMeters} but number of meters synced is ${numberOfMetersSynced}`
    );
  }
}
