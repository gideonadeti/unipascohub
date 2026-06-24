"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function PascoDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer width="narrow" className="space-y-8">
      <div className="flex flex-col items-center gap-4 py-16">
        <h2 className="text-xl font-semibold">Could not load pasco</h2>
        <p className="text-muted-foreground text-sm">
          Something went wrong. Try again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </PageContainer>
  );
}
