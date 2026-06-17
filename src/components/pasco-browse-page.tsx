"use client";

import { FileQuestion, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { PascoBrowseFilters } from "@/components/pasco-browse-filters";
import { PascoBrowsePagination } from "@/components/pasco-browse-pagination";
import { PascoCard } from "@/components/pasco-card";
import { PascoListSkeleton } from "@/components/pasco-list-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourse } from "@/hooks/api/use-courses";
import { usePascosList } from "@/hooks/api/use-pascos";
import { formatEnumLabel } from "@/lib/catalog-labels";
import {
  BROWSE_DEFAULT_LIMIT,
  filtersToSearchParams,
  type PascoListParseError,
  searchParamsToFilters,
} from "@/lib/pasco-list-query";
import type {
  PascoListFilters,
  PascoListSortBy,
  PascoListSortOrder,
} from "@/types/api/pascos";

const PARSE_ERROR_MESSAGES: Record<PascoListParseError, string> = {
  invalid_education_level: "Invalid education level in the URL.",
  invalid_semester_type: "Invalid semester type in the URL.",
  invalid_type: "Invalid pasco type in the URL.",
  invalid_content_type: "Invalid content type in the URL.",
  invalid_academic_year: "Invalid academic year in the URL.",
  invalid_is_complete: "Invalid complete upload value in the URL.",
  invalid_page: "Invalid page number in the URL.",
  invalid_limit: "Invalid page size in the URL.",
  invalid_sort_by: "Invalid sort field in the URL.",
  invalid_sort_order: "Invalid sort order in the URL.",
};

const SORT_OPTIONS: { value: PascoListSortBy; label: string }[] = [
  { value: "createdAt", label: "Date added" },
  { value: "viewCount", label: "Views" },
  { value: "likeCount", label: "Likes" },
  { value: "downloadCount", label: "Downloads" },
  { value: "academicYear", label: "Academic year" },
];

function pushFilters(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  next: PascoListFilters,
) {
  const params = filtersToSearchParams(next, {
    defaultLimit: BROWSE_DEFAULT_LIMIT,
  });
  const query = params.toString();
  router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
}

type ActiveChip = {
  key: keyof PascoListFilters;
  label: string;
};

function buildActiveChips(
  filters: PascoListFilters,
  courseLabel?: string,
): ActiveChip[] {
  const chips: ActiveChip[] = [];

  if (filters.courseId) {
    chips.push({
      key: "courseId",
      label: courseLabel ?? filters.courseId,
    });
  }

  if (filters.academicYear) {
    chips.push({ key: "academicYear", label: filters.academicYear });
  }

  if (filters.educationLevel) {
    chips.push({
      key: "educationLevel",
      label: formatEnumLabel(filters.educationLevel),
    });
  }

  if (filters.semesterType) {
    chips.push({
      key: "semesterType",
      label: formatEnumLabel(filters.semesterType),
    });
  }

  if (filters.type) {
    chips.push({ key: "type", label: formatEnumLabel(filters.type) });
  }

  if (filters.contentType) {
    chips.push({
      key: "contentType",
      label: formatEnumLabel(filters.contentType),
    });
  }

  if (filters.isComplete !== undefined) {
    chips.push({
      key: "isComplete",
      label: filters.isComplete ? "Complete upload" : "Incomplete upload",
    });
  }

  return chips;
}

type PascoBrowsePageContentProps = {
  filters: PascoListFilters;
};

function PascoBrowsePageContent({ filters }: PascoBrowsePageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pascosQuery = usePascosList(filters);
  const courseQuery = useCourse(filters.courseId ?? "");
  const courseLabel = courseQuery.data?.course
    ? `${courseQuery.data.course.code} — ${courseQuery.data.course.title}`
    : undefined;

  const activeChips = buildActiveChips(filters, courseLabel);

  const updateFilters = (next: PascoListFilters) => {
    pushFilters(router, pathname, next);
  };

  const clearFilter = (key: keyof PascoListFilters) => {
    updateFilters({ ...filters, [key]: undefined, page: 1 });
  };

  const handleSortByChange = (sortBy: PascoListSortBy) => {
    updateFilters({ ...filters, sortBy, page: 1 });
  };

  const handleSortOrderChange = (sortOrder: PascoListSortOrder) => {
    updateFilters({ ...filters, sortOrder, page: 1 });
  };

  const page = filters.page ?? 1;
  const limit = filters.limit ?? BROWSE_DEFAULT_LIMIT;
  const sortBy = filters.sortBy ?? "createdAt";
  const sortOrder = filters.sortOrder ?? "desc";

  let resultsStatus: string | null = null;

  if (pascosQuery.isPending) {
    resultsStatus = "Loading pascos…";
  } else if (pascosQuery.isSuccess) {
    const total = pascosQuery.data.pagination.total;
    resultsStatus =
      total === 0
        ? "No results"
        : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}`;
  }

  return (
    <div className="space-y-8">
      <PascoBrowseFilters
        appliedFilters={filters}
        onApply={updateFilters}
        onClear={() => router.replace("/pascos")}
      />

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
              {chip.label}
              <button
                type="button"
                className="inline-flex size-5 items-center justify-center rounded-full hover:bg-muted"
                aria-label={`Remove ${chip.label} filter`}
                onClick={() => clearFilter(chip.key)}
              >
                <X className="size-3" aria-hidden />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="browse-sort-by">Sort by</FieldLabel>
            <Select value={sortBy} onValueChange={handleSortByChange}>
              <SelectTrigger id="browse-sort-by" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="browse-sort-order">Order</FieldLabel>
            <Select value={sortOrder} onValueChange={handleSortOrderChange}>
              <SelectTrigger id="browse-sort-order" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {resultsStatus ? (
          <p
            aria-live="polite"
            aria-atomic="true"
            className="text-sm text-muted-foreground"
          >
            {resultsStatus}
          </p>
        ) : null}
      </div>

      <div aria-busy={pascosQuery.isPending}>
        {pascosQuery.isPending ? <PascoListSkeleton count={limit} /> : null}

        {pascosQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load pascos</AlertTitle>
            <AlertDescription>
              {pascosQuery.error.message || "Something went wrong. Try again."}
            </AlertDescription>
          </Alert>
        ) : null}

        {pascosQuery.isSuccess && pascosQuery.data.pascos.length === 0 ? (
          <EmptyState
            title="No pascos match these filters"
            description="Try clearing a filter or upload a new pasco."
            icon={FileQuestion}
            action={{ label: "Upload a pasco", href: "/pascos/new" }}
          />
        ) : null}

        {pascosQuery.isSuccess && pascosQuery.data.pascos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pascosQuery.data.pascos.map((pasco) => (
                <PascoCard
                  key={pasco.id}
                  pasco={pasco}
                  title={
                    courseLabel && pasco.courseId === filters.courseId
                      ? `${pasco.academicYear} · ${courseLabel}`
                      : undefined
                  }
                />
              ))}
            </div>

            <PascoBrowsePagination
              page={pascosQuery.data.pagination.page}
              totalPages={pascosQuery.data.pagination.totalPages}
              onPageChange={(nextPage) => {
                updateFilters({ ...filters, page: nextPage });
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

export function PascoBrowsePage() {
  const searchParams = useSearchParams();
  const parsed = searchParamsToFilters(searchParams, {
    defaultLimit: BROWSE_DEFAULT_LIMIT,
  });

  if (!parsed.success) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Invalid filters</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{PARSE_ERROR_MESSAGES[parsed.error]}</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pascos">Reset filters</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <PascoBrowsePageContent filters={parsed.filters} />;
}
