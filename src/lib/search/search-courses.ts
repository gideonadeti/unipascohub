import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import { Prisma } from "../../../generated/prisma/client";
import { PascoModerationStatus } from "../../../generated/prisma/enums";

import { expandInstitutionSynonyms } from "./institution-synonyms";
import {
  CODE_SIMILARITY_THRESHOLD,
  DESCRIPTION_SIMILARITY_THRESHOLD,
  INSTITUTION_SIMILARITY_THRESHOLD,
  TITLE_SIMILARITY_THRESHOLD,
  TRGM_MIN_QUERY_LENGTH,
} from "./search-constants";

export type CourseSearchMatchKind =
  | "exact"
  | "prefix"
  | "title"
  | "institution"
  | "program"
  | "description"
  | "fuzzy";

export type CourseSearchResult = {
  id: string;
  code: string;
  title: string;
  institutionId: string;
  institutionName: string;
  pascoCount: number;
  matchKind: CourseSearchMatchKind;
};

type RawCourseSearchRow = {
  id: string;
  code: string;
  title: string;
  institutionId: string;
  institutionName: string;
  pascoCount: number;
  matchKind: CourseSearchMatchKind;
};

type RankedCourse = CourseSearchResult & { rank: number };

function rankCourses(
  courses: Array<{
    id: string;
    code: string;
    title: string;
    institutionId: string;
    institution: { name: string };
    _count: { pascos: number };
  }>,
  courseQuery: string,
): RankedCourse[] {
  const normalizedQuery = courseQuery.trim().toUpperCase();
  const queryWithoutSpace = normalizedQuery.replace(/\s+/g, "");

  return courses
    .map((course): RankedCourse | null => {
      const codeUpper = course.code.toUpperCase();
      const codeCompact = codeUpper.replace(/\s+/g, "");

      let matchKind: CourseSearchMatchKind | null = null;
      let rank = 0;

      if (codeUpper === normalizedQuery || codeCompact === queryWithoutSpace) {
        matchKind = "exact";
        rank = 300;
      } else if (
        codeUpper.startsWith(normalizedQuery) ||
        codeCompact.startsWith(queryWithoutSpace)
      ) {
        matchKind = "prefix";
        rank = 200;
      } else if (
        course.title.toLowerCase().includes(courseQuery.trim().toLowerCase())
      ) {
        matchKind = "title";
        rank = 100;
      }

      if (!matchKind) {
        return null;
      }

      return {
        id: course.id,
        code: course.code,
        title: course.title,
        institutionId: course.institutionId,
        institutionName: course.institution.name,
        pascoCount: course._count.pascos,
        matchKind,
        rank: rank + Math.min(course._count.pascos, 50),
      };
    })
    .filter((course): course is RankedCourse => course !== null)
    .sort((a, b) => {
      if (b.rank !== a.rank) {
        return b.rank - a.rank;
      }

      return a.code.localeCompare(b.code);
    });
}

async function searchCoursesWithPrisma(
  trimmed: string,
  limit: number,
): Promise<CourseSearchResult[]> {
  const normalized = trimmed.toUpperCase();
  const compact = normalized.replace(/\s+/g, "");

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { code: { equals: trimmed, mode: "insensitive" } },
        { code: { equals: normalized, mode: "insensitive" } },
        { code: { startsWith: trimmed, mode: "insensitive" } },
        { code: { startsWith: normalized, mode: "insensitive" } },
        { code: { startsWith: compact, mode: "insensitive" } },
        { title: { contains: trimmed, mode: "insensitive" } },
        {
          programs: {
            some: { name: { contains: trimmed, mode: "insensitive" } },
          },
        },
        {
          pascos: {
            some: {
              description: { contains: trimmed, mode: "insensitive" },
              moderationStatus: PascoModerationStatus.PUBLISHED,
            },
          },
        },
      ],
    },
    include: {
      institution: { select: { name: true } },
      _count: {
        select: {
          pascos: {
            where: { moderationStatus: PascoModerationStatus.PUBLISHED },
          },
        },
      },
    },
    take: Math.max(limit * 3, 24),
  });

  return rankCourses(courses, trimmed).slice(0, limit);
}

async function searchCoursesWithTrigram(
  trimmed: string,
  limit: number,
): Promise<CourseSearchResult[]> {
  const useTrgm = trimmed.length >= TRGM_MIN_QUERY_LENGTH;

  const rows = await prisma.$queryRaw<RawCourseSearchRow[]>`
    SELECT
      c.id,
      c.code,
      c.title,
      c."institutionId",
      i.name AS "institutionName",
      COUNT(DISTINCT p.id)::int AS "pascoCount",
      CASE
        WHEN upper(replace(c.code, ' ', '')) = upper(replace(${trimmed}, ' ', '')) THEN 'exact'
        WHEN upper(c.code) LIKE upper(${trimmed}) || '%' THEN 'prefix'
        WHEN ${useTrgm} AND similarity(i.name, ${trimmed}) >= ${INSTITUTION_SIMILARITY_THRESHOLD} THEN 'institution'
        WHEN c.title ILIKE '%' || ${trimmed} || '%' THEN 'title'
        WHEN MAX(
          CASE
            WHEN pr.name ILIKE '%' || ${trimmed} || '%' THEN 1
            ELSE 0
          END
        ) > 0 THEN 'program'
        WHEN ${useTrgm}
          AND MAX(similarity(coalesce(pr.name, ''), ${trimmed})) >= ${TITLE_SIMILARITY_THRESHOLD}
          THEN 'program'
        WHEN MAX(
          CASE
            WHEN p.description IS NOT NULL AND p.description ILIKE '%' || ${trimmed} || '%' THEN 1
            ELSE 0
          END
        ) > 0 THEN 'description'
        WHEN ${useTrgm}
          AND MAX(similarity(coalesce(p.description, ''), ${trimmed})) >= ${DESCRIPTION_SIMILARITY_THRESHOLD}
          THEN 'description'
        WHEN ${useTrgm} AND similarity(c.title, ${trimmed}) >= ${TITLE_SIMILARITY_THRESHOLD} THEN 'fuzzy'
        WHEN ${useTrgm} AND similarity(c.code, ${trimmed}) >= ${CODE_SIMILARITY_THRESHOLD} THEN 'fuzzy'
        ELSE 'fuzzy'
      END AS "matchKind",
      (
        CASE
          WHEN upper(replace(c.code, ' ', '')) = upper(replace(${trimmed}, ' ', '')) THEN 300
          ELSE 0
        END
        + CASE WHEN upper(c.code) LIKE upper(${trimmed}) || '%' THEN 200 ELSE 0 END
        + CASE
          WHEN ${useTrgm} THEN (similarity(c.code, ${trimmed}) * 120)::int
          ELSE 0
        END
        + CASE
          WHEN ${useTrgm} THEN (similarity(c.title, ${trimmed}) * 100)::int
          ELSE 0
        END
        + CASE
          WHEN ${useTrgm} THEN (similarity(i.name, ${trimmed}) * 60)::int
          ELSE 0
        END
        + CASE
          WHEN ${useTrgm} THEN (MAX(similarity(coalesce(pr.name, ''), ${trimmed})) * 50)::int
          ELSE 0
        END
        + CASE
          WHEN ${useTrgm} THEN (MAX(similarity(coalesce(p.description, ''), ${trimmed})) * 40)::int
          ELSE 0
        END
        + LEAST(COUNT(DISTINCT p.id), 50)
      ) AS rank
    FROM "Course" c
    INNER JOIN "Institution" i ON i.id = c."institutionId"
    LEFT JOIN "Pasco" p ON p."courseId" = c.id
      AND p."moderationStatus" = 'PUBLISHED'
    LEFT JOIN "_CourseToProgram" cp ON cp."A" = c.id
    LEFT JOIN "Program" pr ON pr.id = cp."B"
    WHERE
      upper(replace(c.code, ' ', '')) = upper(replace(${trimmed}, ' ', ''))
      OR upper(c.code) LIKE upper(${trimmed}) || '%'
      OR c.title ILIKE '%' || ${trimmed} || '%'
      OR pr.name ILIKE '%' || ${trimmed} || '%'
      OR (
        p.description IS NOT NULL
        AND p.description ILIKE '%' || ${trimmed} || '%'
      )
      OR (
        ${useTrgm}
        AND similarity(c.code, ${trimmed}) >= ${CODE_SIMILARITY_THRESHOLD}
      )
      OR (
        ${useTrgm}
        AND similarity(c.title, ${trimmed}) >= ${TITLE_SIMILARITY_THRESHOLD}
      )
      OR (
        ${useTrgm}
        AND similarity(i.name, ${trimmed}) >= ${INSTITUTION_SIMILARITY_THRESHOLD}
      )
      OR (
        ${useTrgm}
        AND similarity(pr.name, ${trimmed}) >= ${TITLE_SIMILARITY_THRESHOLD}
      )
      OR (
        ${useTrgm}
        AND p.description IS NOT NULL
        AND similarity(p.description, ${trimmed}) >= ${DESCRIPTION_SIMILARITY_THRESHOLD}
      )
    GROUP BY c.id, c.code, c.title, c."institutionId", i.name
    ORDER BY rank DESC, c.code ASC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    institutionId: row.institutionId,
    institutionName: row.institutionName,
    pascoCount: row.pascoCount,
    matchKind: row.matchKind,
  }));
}

export async function searchCourses(
  courseQuery: string,
  limit = 8,
): Promise<CourseSearchResult[]> {
  const trimmed = expandInstitutionSynonyms(courseQuery.trim());

  if (trimmed.length === 0) {
    return [];
  }

  try {
    return await searchCoursesWithTrigram(trimmed, limit);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Error
    ) {
      logError(
        "Trigram course search failed, falling back to Prisma findMany",
        error,
      );
    }

    return searchCoursesWithPrisma(trimmed, limit);
  }
}

export function isExactCourseMatch(
  courses: CourseSearchResult[],
  courseQuery: string,
): boolean {
  if (courses.length === 0) {
    return false;
  }

  const normalized = courseQuery.trim().toUpperCase();
  const compact = normalized.replace(/\s+/g, "");

  return courses.some((course) => {
    const codeUpper = course.code.toUpperCase();
    const codeCompact = codeUpper.replace(/\s+/g, "");

    return (
      course.matchKind === "exact" &&
      (codeUpper === normalized || codeCompact === compact)
    );
  });
}
