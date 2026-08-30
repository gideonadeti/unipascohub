import { siteUrl } from "@/config/site";
import { formatEnumLabel } from "@/lib/catalog-labels";

type JsonLdItem = {
  name: string;
  href: string;
};

/**
 * Serializes a JSON-LD object for safe embedding inside a
 * `<script type="application/ld+json">` tag. JSON.stringify does not escape
 * `<`, so a user-controlled string containing `</script>` could otherwise
 * break out of the script context. Also escapes `>`, `&`, and the U+2028 /
 * U+2029 line separators (invalid inside JS string literals).
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

type PascoForJsonLd = {
  id: string;
  academicYear: string;
  description: string | null;
  educationLevel: string;
  semesterType: string;
  type: string;
  likeCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type CourseForJsonLd = {
  code: string;
  title: string;
  institution?: { name: string } | null;
};

export function breadcrumbJsonLd(items: JsonLdItem[]) {
  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${siteUrl}${item.href}`,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

export function pascoJsonLd(
  pasco: PascoForJsonLd,
  course: CourseForJsonLd | null,
  uploaderName?: string,
) {
  const courseLabel = course
    ? `${course.code} ${course.title}`
    : "Past exam paper";
  const description =
    pasco.description ??
    `Download ${courseLabel} ${formatEnumLabel(pasco.educationLevel)} ${formatEnumLabel(pasco.semesterType)} ${formatEnumLabel(pasco.type)} past questions (${pasco.academicYear}).`;

  return {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: courseLabel,
    description,
    dateCreated: pasco.createdAt.toISOString().split("T")[0],
    dateModified: pasco.updatedAt.toISOString().split("T")[0],
    ...(uploaderName
      ? { author: { "@type": "Person", name: uploaderName } }
      : {}),
    educationalLevel: formatEnumLabel(pasco.educationLevel),
    ...(course
      ? {
          about: {
            "@type": "Course",
            name: course.title,
            courseCode: course.code,
            ...(course.institution
              ? {
                  provider: {
                    "@type": "EducationalOrganization",
                    name: course.institution.name,
                  },
                }
              : {}),
          },
        }
      : {}),
  };
}
