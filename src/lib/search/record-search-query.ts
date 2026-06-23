import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import type {
  Prisma,
  SearchQuerySource,
} from "../../../generated/prisma/client";

const MIN_QUERY_LENGTH = 2;

export type RecordSearchQueryInput = {
  query: string;
  source: SearchQuerySource;
  userId?: string | null;
  resultCount?: number;
  noCourseMatch?: boolean;
  metadata?: Prisma.InputJsonValue;
};

export function recordSearchQuery(input: RecordSearchQueryInput): void {
  const trimmed = input.query.trim();

  if (trimmed.length < MIN_QUERY_LENGTH) {
    return;
  }

  void prisma.searchQuery
    .create({
      data: {
        query: trimmed.slice(0, 200),
        source: input.source,
        userId: input.userId ?? null,
        resultCount: input.resultCount,
        noCourseMatch: input.noCourseMatch,
        metadata: input.metadata ?? undefined,
      },
    })
    .catch((error) => {
      logError("Search analytics insert failed", error);
    });
}
