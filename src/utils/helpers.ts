import os from "os"
import { MeterDataPointEdge, MeterTransactionData } from "../types"
import { arweaveConfig } from "../config/arweave"

export function buildMeterDataPoint(
  meterNumber_: string,
  contractId_: string,
  transactionData: {
    transactionId: string
    response: MeterTransactionData<"meter">
  }[],
  transactionIDToEdgeDataMap: {
    [key: string]: {
      id: string
      cursor: string
      blockTimestamp: number
      tags: any
    }
  }
): MeterDataPointEdge[] {
  return transactionData
    .map(({ transactionId, response }) => {
      const edgeData = transactionIDToEdgeDataMap[transactionId]

      if (!edgeData) {
        console.warn(`No edge data found for transaction ID: ${transactionId}`)
        return null
      }

      if (typeof response !== "object") {
        console.warn(
          `Invalid response for transaction ID: ${transactionId}, expected object but got ${typeof response}`
        )
        return null
      }
      if (!response.input || !response.input.payload) {
        console.warn(
          `Invalid response structure for transaction ID: ${transactionId}`
        )
        return null
      }

      if (response.input.payload.length !== 3) {
        console.warn(
          `Invalid payload length for transaction ID: ${transactionId}, expected 3 but got ${response.input.payload.length}`
        )
        return null
      }

      const [nonce, voltage, current, energy] = JSON.parse(
        response.input.payload[0]
      )

      const contractId = edgeData.tags["Contract"] || contractId_ || null

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
      } as unknown as MeterDataPointEdge
    })
    .filter((dataPoint) => dataPoint !== null)
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
  const parsedData = JSON.parse(transactionData)
  const { data, function: func } = parsedData
  const [signature, publicKey, payload] = data
  const [nonce, voltage, current, energy = 0] = payload
  const newSchema = {
    input: {
      payload: [
        JSON.stringify([nonce, voltage, current, energy]),
        signature,
        publicKey,
      ],
      function: func,
    },
  }
  console.log("newSchema", newSchema)
  return newSchema
}

export function logMemoryStatistics() {
  // in MB
  const memoryUsage = process.memoryUsage()
  const freeMemory = os.freemem() / (1024 * 1024) // Convert to MB
  const totalMemory = os.totalmem() / (1024 * 1024) // Convert to MB
  console.log("Memory Usage Statistics:")
  console.log(`RSS: ${(memoryUsage.rss / (1024 * 1024)).toFixed(2)} MB`)
  console.log(
    `Heap Total: ${(memoryUsage.heapTotal / (1024 * 1024)).toFixed(2)} MB`
  )
  console.log(
    `Heap Used: ${(memoryUsage.heapUsed / (1024 * 1024)).toFixed(2)} MB`
  )
  console.log(`Free Memory: ${freeMemory.toFixed(2)} MB`)
  console.log(`Total Memory: ${totalMemory.toFixed(2)} MB`)
  console.log(
    `Memory Usage Percentage: ${(
      (memoryUsage.heapUsed / memoryUsage.heapTotal) *
      100
    ).toFixed(2)}%`
  )
  console.log(
    `Free Memory Percentage: ${((freeMemory / totalMemory) * 100).toFixed(2)}%`
  )
  console.log(
    `Memory Usage by Process: ${(
      (memoryUsage.heapUsed / totalMemory) *
      100
    ).toFixed(2)}%`
  )
  console.log(
    `Memory Usage by OS: ${(
      ((os.totalmem() - os.freemem()) / os.totalmem()) *
      100
    ).toFixed(2)}%`
  )
}

/**
 * Makes a request to the Arweave gateway with automatic gateway rotation on failure.
 *
 * @param path The path to the Arweave endpoint, e.g., "/graphql"
 * @param config Request configuration options
 * @returns Promise<Response>
 * @throws Error if the request fails
 */
export async function makeRequestToArweaveNetwork(
  path: string = "/",
  config: RequestInit = {},
  attempt: number = 0,
  maxAttempts: number = 5
): Promise<Response> {
  const url = arweaveConfig.getGatewayUrl() + path

  console.log(`Making request to Arweave: ${url} with attempt ${attempt + 1}`)

  try {
    const response = await fetch(url, {
      ...config,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    })

    if (response.status === 429 || response.status === 503) {
      console.warn(
        `Request to ${url} failed with status ${response.status}. retrying...`
      )
      // wait 10ms and try again
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return await makeRequestToArweaveNetwork(
          path,
          config,
          attempt + 1,
          maxAttempts
        )
      }
      throw new Error(`Max attempts reached for ${url}`)
    }

    console.log(`"Success" Response from ${url}:`, response.status)

    return response
  } catch (error: any) {
    const isTimeout =
      error?.code === "ETIMEDOUT" ||
      error?.message?.includes("fetch failed") ||
      error?.cause?.code === "ETIMEDOUT"

    if (isTimeout) {
      console.error(`Timeout when accessing ${url}. retrying...`)
      // wait 10ms and try again
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2 * attempt)) // Exponential backoff
        return await makeRequestToArweaveNetwork(
          path,
          config,
          attempt + 1,
          maxAttempts
        )
      }
    }

    console.error(`Error making request to Arweave:`, error)
    throw error
  }
}
