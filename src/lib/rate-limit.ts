import { createClient, type RedisClientType } from "redis";

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
      console.error("Redis rate limit error:", error);
    });

    await client.connect();
    redisClient = client as RedisClientType;

    return redisClient;
  })();

  try {
    return await redisConnectPromise;
  } catch (error) {
    console.error("Failed to connect to Redis for rate limiting:", error);
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
  const count = await client.incr(key);

  if (count === 1) {
    await client.expire(key, windowSeconds);
  }

  if (count > options.limit) {
    const ttl = await client.ttl(key);
    const retryAfterSeconds = ttl > 0 ? ttl : windowSeconds;

    return { rateLimited: true, retryAfterSeconds };
  }

  return { rateLimited: false };
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

export function getPascoListRateLimitOptions(): RateLimitOptions {
  return {
    limit: parsePositiveInt(process.env.PASCO_LIST_RATE_LIMIT, 120),
    windowMs: parsePositiveInt(process.env.PASCO_LIST_RATE_WINDOW_MS, 900_000),
  };
}
