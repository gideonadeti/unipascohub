import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFoundPage() {
  return (
    <PageContainer width="narrow" className="space-y-8">
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className={cn(typography.display)}>Page not found</h1>
        <p className={cn(typography.body, "text-muted-foreground max-w-md")}>
          This page does not exist or the pasco you are looking for may have
          been removed.
        </p>
        <Button asChild>
          <Link href="/pascos">Browse pascos</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
