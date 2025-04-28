export interface Meter {
  contractId: string;
  meterNumber: string;
  publicKey: string;
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

export interface ArweaveResponseBody {
  data: {
    transactions: {
      edges: {
        cursor: string;
        node: {
          id: string;
          block: {
            timestamp: number;
          };
        };
      }[];
    };
  };
}

export interface MeterTransactionData<functionName> {
  input: {
    payload: [`[${string}]`, string, string];
    function: functionName;
  };
}
