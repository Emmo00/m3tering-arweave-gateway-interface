import { arweaveConfig } from "../config/arweave";

// Simple in-memory cache with expiration and size limit
type CacheEntry<T> = { value: T; expiresAt: number };
const CACHE_MAX_ENTRIES = 120;
const cache = new Map<string, CacheEntry<any>>();

export function setCache<T>(key: string, value: T, ttlMs: number) {
  // Clean up if over limit
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Remove oldest entry
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function getCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

const MAX_CONCURRENT_REQUESTS = 20;
let activeRequests = 0;
const requestQueue: (() => void)[] = [];

export async function makeRequestToArweave<T>(query: string): Promise<T> {
  // Determine if this is a MeterDataPoint resolver query and extract sortBy
  let sortBy: string | undefined;
  try {
    // crude extraction of sort: ... from query string
    const sortMatch = query.match(/sort:\s*([A-Z_]+)/);
    if (sortMatch) sortBy = sortMatch[1];
  } catch {}
  // Only cache for HEIGHT_ASC or HEIGHT_DESC
  let cacheKey: string | undefined;
  let cacheTtl: number | undefined;
  cacheKey = `MeterDataPoint:${sortBy}:${query}`;
  cacheTtl = 24 * 60 * 60 * 1000; // 1 day

  if (cacheKey) {
    const cached = getCache<T>(cacheKey);
    if (cached) return cached;
  }
  try {
    const response = await makeRequestToArweaveNetwork("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (cacheKey && cacheTtl) setCache(cacheKey, data as T, cacheTtl);
    return data as T;
  } catch (error) {
    console.error("Error making request to Arweave:", error);
    throw error;
  }
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
  return enqueue(async () => {
    const url = arweaveConfig.getGatewayUrl() + path;

    process.stdout.write(`Making request to Arweave: ${url} with attempt ${attempt + 1}\r`);

    try {
      const response = await fetch(url, {
        ...config,
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
      });

      if (
        response.status === 429 ||
        response.status === 503 ||
        response.status === 529 ||
        response.status === 572
      ) {
        process.stdout.write(
          `Request to ${url} failed with status ${response.status}. retrying...\r`
        );
        // wait 10ms and try again
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return await makeRequestToArweaveNetwork(path, config, attempt + 1, maxAttempts);
        }
        throw new Error(`Max attempts reached for ${url}`);
      }

      return response;
    } catch (error: any) {
      const isTimeout =
        error?.code === "ETIMEDOUT" ||
        error?.message?.includes("fetch failed") ||
        error?.cause?.code === "ETIMEDOUT";

      if (isTimeout) {
        console.error(`Timeout when accessing ${url}. retrying...`);
        // wait 10ms and try again
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2 * attempt)); // Exponential backoff
          return await makeRequestToArweaveNetwork(path, config, attempt + 1, maxAttempts);
        }
      }

      console.error(`Error making request to Arweave:`, error);
      throw error;
    }
  });
}

// Queue manager
async function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => requestQueue.push(resolve));
  }

  activeRequests++;

  try {
    return await fn();
  } finally {
    activeRequests--;
    if (requestQueue.length > 0) {
      const next = requestQueue.shift();
      if (next) next();
    }
  }
}

export const testConnectionToArweaveGateway = async () => {
  try {
    const response = await makeRequestToArweaveNetwork();

    if (!response.ok) {
      throw new Error("Failed to connect to Arweave");
    }

    const data = await response.json();
    console.log("Connected to Arweave:", data);
  } catch (error) {
    console.error("Error connecting to Arweave:", error);
    throw error;
  }
};
