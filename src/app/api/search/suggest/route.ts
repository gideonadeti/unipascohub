import { NextResponse } from "next/server";
import { MAX_SEARCH_QUERY_LENGTH } from "@/lib/pasco-list-query";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseSearchQuery } from "@/lib/search/parse-search-query";
import { searchCourses } from "@/lib/search/search-courses";

export const runtime = "nodejs";

const SUGGEST_RATE_LIMIT = 60;
const SUGGEST_RATE_WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;
const MIN_QUERY_LENGTH = 2;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return "unknown";
}

export async function GET(req: Request) {
  const rateLimit = await checkRateLimit(`search-suggest:${getClientIp(req)}`, {
    limit: SUGGEST_RATE_LIMIT,
    windowMs: SUGGEST_RATE_WINDOW_MS,
  });

  if (rateLimit.rateLimited) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: rateLimit.retryAfterSeconds
          ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  const url = new URL(req.url);
  const rawQ = url.searchParams.get("q")?.trim() ?? "";
  const limitParam = url.searchParams.get("limit");
  const limit =
    limitParam === null ? DEFAULT_LIMIT : Number.parseInt(limitParam, 10);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  if (rawQ.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({
      q: rawQ,
      courses: [],
      detectedFilters: {},
      tokens: [],
    });
  }

  if (rawQ.length > MAX_SEARCH_QUERY_LENGTH) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  try {
    const parsed = parseSearchQuery(rawQ);
    const courses = parsed.courseQuery
      ? await searchCourses(parsed.courseQuery, limit)
      : [];

    return NextResponse.json({
      q: rawQ,
      courses: courses.map((course) => ({
        id: course.id,
        code: course.code,
        title: course.title,
        institutionName: course.institutionName,
        pascoCount: course.pascoCount,
      })),
      detectedFilters: parsed.filters,
      tokens: parsed.tokens,
    });
  } catch (error) {
    console.error("Search suggest failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
