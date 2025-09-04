import { BuildArweaveTransactionQueryConfigV2 } from '../../types';

export function buildArweaveTransactionQuery({
  meterNumber,
  first,
  after,
  sortBy,
}: BuildArweaveTransactionQueryConfigV2): string {
  return `{
        transactions(
            first: ${first || 10}
            sort: ${sortBy || 'HEIGHT_DESC'}
            after: "${after || ''}"
            tags: [
                { name: "Contract-Use", values: ["M3tering Protocol Test"] },
                { name: "Content-Type", values: ["text/plain"] },
            ${
              !meterNumber && meterNumber !== 0
                ? `
                {
                    name: "M3ter-ID"
                    values: ["${meterNumber}"]
                }
                    `
                : ''
            }
            ]
        ) {
            edges {
                cursor
                node {
                    id
                    tags {
                        name
                        value
                    }
                }
            }
        }
    }`;
}
