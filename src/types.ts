export interface Meter {
  contractId: string;
  meterNumber: string;
  state: {
    app_eui: string;
    app_key: string;
    dev_eui: string;
    is_on: boolean;
    kwh_balance: number;
    last_block: number;
    nonce: number;
    public_key: string;
    token_id: number;
  };
}

export interface MeterDataPointPayload {
  nonce: number;
  voltage: number;
  current: number;
  energy: number;
  signature: string;
  publicKey: string;
}

export interface MeterDataPoint {
  transactionId: string;
  contractId: string;
  meterNumber: string;
  timestamp: number;
  payload: MeterDataPointPayload;
}

export interface MeterDataPointEdge {
  cursor: string;
  node: MeterDataPoint;
}

export interface MeterDataPointConnection {
  edges: MeterDataPointEdge[];
}

export interface MeterResolverArgs {
  meterNumber?: string;
  contractId?: string;
}

export interface MeterDataPointsResolverArgs {
  meterNumber?: string;
  contractId?: string;
  first?: number;
  after?: string;
  sortBy?: string;
}

export interface BuildArweaveTransactionQueryConfig {
  contractId: string;
  after?: string;
  first?: number;
  sortBy?: string;
}

export interface ArweaveTransactionEdge {
  cursor: string;
  node: {
    id: string;
    block: {
      timestamp: number;
    };
    tags?: {
      name: string;
      value: string;
    }[];
  };
}

export interface ArweaveTransactionsResponseBody {
  data: {
    transactions: {
      edges: ArweaveTransactionEdge[];
    };
  };
}

export type MeterTransactionData<FunctionName extends "meter" | "initial"> =
  FunctionName extends "meter"
    ? {
        input: {
          payload: [string, string, string];
          function: FunctionName;
        };
      }
    : FunctionName extends "initial"
    ? {
        token_id: number;
      }
    : never;
