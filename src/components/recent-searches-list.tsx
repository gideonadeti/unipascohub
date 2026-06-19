"use client";

import { Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";

type RecentSearchesListProps = {
  searches: string[];
  onSelect: (query: string) => void;
  onRemove?: (query: string) => void;
  activeIndex?: number;
  className?: string;
  itemClassName?: string;
};

export function RecentSearchesList({
  searches,
  onSelect,
  onRemove,
  activeIndex = -1,
  className,
  itemClassName,
}: RecentSearchesListProps) {
  if (searches.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <p className="mb-2 px-3 pt-2 text-xs font-medium text-muted-foreground">
        Recent searches
      </p>
      <ul className="pb-1">
        {searches.map((search, index) => (
          <li key={search} role="presentation">
            <div
              className={cn(
                "flex items-center gap-1 hover:bg-muted",
                index === activeIndex && "bg-muted",
                itemClassName,
              )}
            >
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(search)}
              >
                <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{search}</span>
              </button>
              {onRemove ? (
                <button
                  type="button"
                  className="mr-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label={`Remove ${search} from recent searches`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onRemove(search)}
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
