#!/usr/bin/env node
// Production db:deploy with resilience against two transient Neon/Vercel
// failure modes:
//   1. Prisma's migration advisory lock (P1002) is held by a concurrent
//      Vercel build running db:deploy against the same database, or
//   2. a cold Neon compute makes the first queries slow.
// Everything here is idempotent (migrate deploy no-ops when applied, seeds
// upsert), so retrying the whole sequence is safe.

import { spawnSync } from "node:child_process";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 15_000;

// Signatures that mean "transient — worth retrying".
const RETRY_SIGNATURES = [
  "P1002", // database reached but timed out (incl. advisory lock wait)
  "P1001", // database unreachable (cold compute)
  "advisory lock",
];

const SEED_SCRIPTS = [
  "seed-institutions",
  "seed-atu-programs",
  "seed-atu-eee-courses",
];

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return {
    status: result.status ?? 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function isRetryable(output) {
  return RETRY_SIGNATURES.some((signature) =>
    output.toLowerCase().includes(signature.toLowerCase()),
  );
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      console.log(`[db:deploy] retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await sleep(RETRY_DELAY_MS);
    }

    console.log(`[db:deploy] attempt ${attempt}/${MAX_ATTEMPTS}`);

    console.log("[db:deploy] prisma migrate deploy");
    const migrate = run("pnpm", ["exec", "prisma", "migrate", "deploy"]);

    if (migrate.status !== 0) {
      if (isRetryable(migrate.output) && attempt < MAX_ATTEMPTS) {
        continue;
      }

      console.error("[db:deploy] migrate deploy failed (non-retryable)");
      process.exit(migrate.status);
    }

    let seedsOk = true;

    for (const seed of SEED_SCRIPTS) {
      console.log(`[db:deploy] pnpm run ${seed}`);
      const seedResult = run("pnpm", ["run", seed]);

      if (seedResult.status !== 0) {
        if (isRetryable(seedResult.output) && attempt < MAX_ATTEMPTS) {
          // Retry the whole sequence — migrations no-op on re-run.
          seedsOk = false;
          break;
        }

        console.error("[db:deploy] seed failed (non-retryable)");
        process.exit(seedResult.status);
      }
    }

    if (!seedsOk) {
      continue;
    }

    console.log("[db:deploy] completed successfully");

    return;
  }

  console.error("[db:deploy] exhausted all retry attempts");
  process.exit(1);
}

await main();
