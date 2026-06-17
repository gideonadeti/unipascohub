"use client";

import { Button } from "@/components/ui/button";

type PascoBrowsePaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function PascoBrowsePagination({
  page,
  totalPages,
  onPageChange,
}: PascoBrowsePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
