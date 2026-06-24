import { createClient, type RedisClientType } from "redis";
import { logError } from "@/lib/logger";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  rateLimited: boolean;
  retryAfterSeconds?: number;
};

type MemoryEntry = {
  count: number;
  resetAt: number;
};

let redisClient: RedisClientType | null = null;
let redisConnectPromise: Promise<RedisClientType | null> | null = null;
let warnedMemoryFallback = false;

const MEMORY_STORE_MAX = 10_000;
const memoryStore = new Map<string, MemoryEntry>();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

async function getRedisClient(): Promise<RedisClientType | null> {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (redisConnectPromise) {
    return redisConnectPromise;
  }

  redisConnectPromise = (async () => {
    const client = createClient({ url: redisUrl });

    client.on("error", (error) => {
      logError("Redis rate limit error", error);
    });

    await client.connect();
    redisClient = client as RedisClientType;

    return redisClient;
  })();

  try {
    return await redisConnectPromise;
  } catch (error) {
    logError("Failed to connect to Redis for rate limiting", error);
    redisConnectPromise = null;
    redisClient = null;

    return null;
  }
}

async function checkRedisRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const client = await getRedisClient();

  if (!client) {
    return checkMemoryRateLimit(key, options);
  }

  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));

  const created = await client.set(key, 1, { NX: true, EX: windowSeconds });

  if (created === null) {
    const count = await client.incr(key);

    if (count > options.limit) {
      const ttl = await client.ttl(key);
      const retryAfterSeconds = ttl > 0 ? ttl : windowSeconds;

      return { rateLimited: true, retryAfterSeconds };
    }
  }

  return { rateLimited: false };
}

function evictMemoryStore(): void {
  if (memoryStore.size < MEMORY_STORE_MAX) return;

  let oldestKey: string | undefined;
  let oldestResetAt = Infinity;

  for (const [key, entry] of memoryStore) {
    if (entry.resetAt < oldestResetAt) {
      oldestResetAt = entry.resetAt;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    memoryStore.delete(oldestKey);
  }
}

function checkMemoryRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  if (!warnedMemoryFallback) {
    console.warn(
      "REDIS_URL is not set; using in-memory rate limiting (single-instance only)",
    );
    warnedMemoryFallback = true;
  }

  const now = Date.now();
  const existing = memoryStore.get(key);

  if (existing === undefined || now >= existing.resetAt) {
    evictMemoryStore();
    memoryStore.set(key, { count: 1, resetAt: now + options.windowMs });

    return { rateLimited: false };
  }

  existing.count += 1;

  if (existing.count > options.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );

    return { rateLimited: true, retryAfterSeconds };
  }

  return { rateLimited: false };
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (redisUrl) {
    return checkRedisRateLimit(key, options);
  }

  return checkMemoryRateLimit(key, options);
}

export function getCloudinarySignRateLimitOptions(): RateLimitOptions {
  return {
    limit: parsePositiveInt(process.env.CLOUDINARY_SIGN_RATE_LIMIT, 30),
    windowMs: parsePositiveInt(
      process.env.CLOUDINARY_SIGN_RATE_WINDOW_MS,
      900_000,
    ),
  };
}

export function getPascoReactionRateLimitOptions(): RateLimitOptions {
  return {
    limit: parsePositiveInt(process.env.PASCO_REACTION_RATE_LIMIT, 60),
    windowMs: parsePositiveInt(
      process.env.PASCO_REACTION_RATE_WINDOW_MS,
      900_000,
    ),
  };
}

export function getPascoDownloadRateLimitOptions(): RateLimitOptions {
  return {
    limit: parsePositiveInt(process.env.PASCO_DOWNLOAD_RATE_LIMIT, 120),
    windowMs: parsePositiveInt(
      process.env.PASCO_DOWNLOAD_RATE_WINDOW_MS,
      900_000,
    ),
  };
}

export function getPascoViewDedupeOptions(): RateLimitOptions {
  return {
    limit: 1,
    windowMs: parsePositiveInt(
      process.env.PASCO_VIEW_DEDUPE_WINDOW_MS,
      3_600_000,
    ),
  };
}

export function getPascoViewGlobalRateLimitOptions(): RateLimitOptions {
  return {
    limit: parsePositiveInt(process.env.PASCO_VIEW_GLOBAL_RATE_LIMIT, 300),
    windowMs: parsePositiveInt(
      process.env.PASCO_VIEW_GLOBAL_RATE_WINDOW_MS,
      900_000,
    ),
  };
}

export function getPascoCreateRateLimitOptions(): RateLimitOptions {
  return {
    limit: parsePositiveInt(process.env.PASCO_CREATE_RATE_LIMIT, 10),
    windowMs: parsePositiveInt(
      process.env.PASCO_CREATE_RATE_WINDOW_MS,
      900_000,
    ),
  };
}

export function getPascoListRateLimitOptions(): RateLimitOptions {
  return {
    limit: parsePositiveInt(process.env.PASCO_LIST_RATE_LIMIT, 120),
    windowMs: parsePositiveInt(process.env.PASCO_LIST_RATE_WINDOW_MS, 900_000),
  };
}

export function getCatalogSubmissionCreateRateLimitOptions(): RateLimitOptions {
  return {
    limit: parsePositiveInt(
      process.env.CATALOG_SUBMISSION_CREATE_RATE_LIMIT,
      10,
    ),
    windowMs: parsePositiveInt(
      process.env.CATALOG_SUBMISSION_CREATE_RATE_WINDOW_MS,
      900_000,
    ),
  };
}

export function getUpgradeToContributorRateLimitOptions(): RateLimitOptions {
  return {
    limit: parsePositiveInt(process.env.UPGRADE_TO_CONTRIBUTOR_RATE_LIMIT, 3),
    windowMs: parsePositiveInt(
      process.env.UPGRADE_TO_CONTRIBUTOR_RATE_WINDOW_MS,
      900_000,
    ),
  };
}
