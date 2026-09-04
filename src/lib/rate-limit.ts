import { Redis } from "@upstash/redis";
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

let redisClient: Redis | null = null;
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

function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  // Upstash's REST client is stateless (one HTTPS request per command), which
  // is what makes it correct for serverless: unlike a TCP connection there is
  // no socket to freeze or drop between invocations.
  redisClient = new Redis({ url, token });

  return redisClient;
}

async function checkRedisRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const client = getRedisClient();

  if (!client) {
    return checkMemoryRateLimit(key, options);
  }

  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));

  try {
    // INCR + TTL in a single round-trip. A brand-new key gets count 1 and its
    // TTL set right after; a TTL-less key (e.g. INCR raced with expiry) is
    // repaired so the window can actually reset instead of persisting forever.
    // pipeline exec() throws on any command failure, which the catch below
    // turns into the in-memory fallback.
    const [count, ttl] = await client.pipeline().incr(key).ttl(key).exec();

    if (ttl < 0) {
      await client.expire(key, windowSeconds);
    }

    if (count > options.limit) {
      return {
        rateLimited: true,
        retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    }

    return { rateLimited: false };
  } catch (error) {
    // Transient Redis failures must not turn public endpoints into 500s.
    // Degrade to the in-memory limiter; the REST client is stateless, so the
    // next request simply tries Redis again.
    logError(
      "Redis rate limit command failed; falling back to in-memory limiter",
      error,
    );

    return checkMemoryRateLimit(key, options);
  }
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
      "In-memory rate limiting in use (single-instance only); Redis is unavailable",
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
  if (
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  ) {
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
