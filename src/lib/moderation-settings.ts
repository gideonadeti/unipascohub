import { prisma } from "@/lib/db";

export const MODERATION_DISLIKE_THRESHOLD_KEY = "moderation_dislike_threshold";

const DEFAULT_DISLIKE_THRESHOLD = 5;

function parseThreshold(value: string | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value.trim(), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function getEnvThreshold(): number {
  const parsed = parseThreshold(process.env.MODERATION_DISLIKE_THRESHOLD);

  return parsed ?? DEFAULT_DISLIKE_THRESHOLD;
}

export async function getModerationDislikeThreshold(): Promise<number> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: MODERATION_DISLIKE_THRESHOLD_KEY },
    select: { value: true },
  });

  const fromDb = parseThreshold(setting?.value);

  if (fromDb !== null) {
    return fromDb;
  }

  return getEnvThreshold();
}

export async function setModerationDislikeThreshold(
  value: number,
): Promise<number> {
  if (!Number.isFinite(value) || value < 1) {
    throw new Error("Threshold must be an integer >= 1");
  }

  const normalized = Math.floor(value).toString();

  await prisma.appSetting.upsert({
    where: { key: MODERATION_DISLIKE_THRESHOLD_KEY },
    create: {
      key: MODERATION_DISLIKE_THRESHOLD_KEY,
      value: normalized,
    },
    update: {
      value: normalized,
    },
  });

  return Math.floor(value);
}

export async function getModerationSettingsForApi(): Promise<{
  dislikeThreshold: number;
}> {
  return {
    dislikeThreshold: await getModerationDislikeThreshold(),
  };
}
