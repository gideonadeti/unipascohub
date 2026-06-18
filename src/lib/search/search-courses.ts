import { prisma } from "@/lib/db";

export type CourseSearchResult = {
  id: string;
  code: string;
  title: string;
  institutionId: string;
  institutionName: string;
  pascoCount: number;
  matchKind: "exact" | "prefix" | "title";
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
    .map((course) => {
      const codeUpper = course.code.toUpperCase();
      const codeCompact = codeUpper.replace(/\s+/g, "");

      let matchKind: CourseSearchResult["matchKind"] | null = null;
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

export async function searchCourses(
  courseQuery: string,
  limit = 8,
): Promise<CourseSearchResult[]> {
  const trimmed = courseQuery.trim();

  if (trimmed.length === 0) {
    return [];
  }

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
      ],
    },
    include: {
      institution: { select: { name: true } },
      _count: { select: { pascos: true } },
    },
    take: Math.max(limit * 3, 24),
  });

  return rankCourses(courses, trimmed).slice(0, limit);
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
