"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/layout/section";
import { PascoCard } from "@/components/pasco-card";
import { PascoListSkeleton } from "@/components/pasco-list-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePascosList } from "@/hooks/api/use-pascos";
import type { PascoListFilters } from "@/types/api/pascos";

type PascoListSectionProps = {
  title: string;
  description?: string;
  filters?: PascoListFilters;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; href: string };
  viewAllHref?: string;
};

export function PascoListSection({
  title,
  description,
  filters = {},
  emptyTitle = "No pascos yet",
  emptyDescription = "Be the first to upload a past exam paper.",
  emptyAction = { label: "Upload a pasco", href: "/pascos/new" },
  viewAllHref,
}: PascoListSectionProps) {
  const pascosQuery = usePascosList(filters);

  if (pascosQuery.isPending) {
    return (
      <Section title={title} description={description}>
        <PascoListSkeleton count={filters.limit ?? 6} />
      </Section>
    );
  }

  if (pascosQuery.isError) {
    return (
      <Section title={title} description={description}>
        <Alert variant="destructive">
          <AlertTitle>Could not load pascos</AlertTitle>
          <AlertDescription>
            {pascosQuery.error.message || "Something went wrong. Try again."}
          </AlertDescription>
        </Alert>
      </Section>
    );
  }

  const pascos = pascosQuery.data.pascos;

  if (pascos.length === 0) {
    return (
      <Section title={title} description={description}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={FileQuestion}
          action={emptyAction}
        />
      </Section>
    );
  }

  return (
    <Section title={title} description={description}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pascos.map((pasco) => (
          <PascoCard key={pasco.id} pasco={pasco} />
        ))}
      </div>
      {viewAllHref ? (
        <div className="flex justify-center pt-2">
          <Button variant="ghost" asChild>
            <Link href={viewAllHref}>View all</Link>
          </Button>
        </div>
      ) : null}
    </Section>
  );
}
