import { BuildArweaveTransactionQueryConfigV2 } from '../../types';

export function buildArweaveTransactionQuery({
  meterNumber,
  first,
  after,
  sortBy,
  nonces,
  block,
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
              meterNumber || (!meterNumber && meterNumber === 0)
                ? `
                {
                    name: "M3ter-ID"
                    values: ["${meterNumber}"]
                },
                    `
                : ''
            }
            ${
              !nonces || nonces.length === 0
                ? ''
                : `
                {
                    name: "Nonce"
                    values: [${nonces.map((n) => `"${n}"`).join(', ')}]
                },
                    `
            }
            ]
            ${
              block && (block.min !== undefined || block.max !== undefined)
                ? `block: { ${block.min !== undefined ? `min: ${block.min}` : ''} ${block.max !== undefined ? `\n max: ${block.max}` : ''} }`
                : ''
            }
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
