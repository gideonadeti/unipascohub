"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { RecentSearchesList } from "@/components/recent-searches-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { heroCopy, heroSearchExamples } from "@/config/site";
import { useSearchSuggest } from "@/hooks/api/use-search-suggest";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { formatEnumLabel } from "@/lib/catalog-labels";
import {
  buildBrowseHref,
  buildBrowseHrefFromQuery,
} from "@/lib/search/build-browse-href";
import { cn } from "@/lib/utils";
import type { SearchSuggestCourse } from "@/types/api/search";

const STATIC_PLACEHOLDER = "Search by course, level, year…";
const TYPING_INTERVAL_MS = 80;
const PAUSE_AFTER_WORD_MS = 2000;
const DEBOUNCE_MS = 250;

function formatFilterChipLabel(key: string, value: string): string {
  if (key === "academicYear") {
    return value;
  }

  return formatEnumLabel(value);
}

export function HeroSearch() {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [displayText, setDisplayText] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const {
    recents,
    push: pushRecent,
    remove: removeRecent,
  } = useRecentSearches();

  const suggestQuery = useSearchSuggest(debouncedValue);
  const courses = suggestQuery.data?.courses ?? [];
  const detectedFilters = suggestQuery.data?.detectedFilters ?? {};
  const hasDetectedFilters = Object.keys(detectedFilters).length > 0;
  const showRecents = focused && value.trim().length < 2 && recents.length > 0;
  const showSuggestions =
    focused &&
    debouncedValue.trim().length >= 2 &&
    (suggestQuery.isFetching || courses.length > 0 || hasDetectedFilters);
  const showDropdown = showRecents || showSuggestions;
  const selectableCount = (showRecents ? recents.length : 0) + courses.length;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const handleViewportChange = () => {
      if (
        document.activeElement === containerRef.current?.querySelector("input")
      ) {
        setFocused(false);
        setActiveIndex(-1);
      }
    };

    viewport.addEventListener("resize", handleViewportChange);
    return () => viewport.removeEventListener("resize", handleViewportChange);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
      setActiveIndex(-1);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    if (reducedMotion || focused || value.length > 0) {
      return;
    }

    const currentExample = heroSearchExamples[exampleIndex] ?? "";
    const timeout = window.setTimeout(
      () => {
        if (!deleting) {
          if (charIndex < currentExample.length) {
            setDisplayText(currentExample.slice(0, charIndex + 1));
            setCharIndex((index) => index + 1);
            return;
          }

          window.setTimeout(() => setDeleting(true), PAUSE_AFTER_WORD_MS);
          return;
        }

        if (charIndex > 0) {
          setDisplayText(currentExample.slice(0, charIndex - 1));
          setCharIndex((index) => index - 1);
          return;
        }

        setDeleting(false);
        setExampleIndex((index) => (index + 1) % heroSearchExamples.length);
      },
      deleting ? TYPING_INTERVAL_MS / 2 : TYPING_INTERVAL_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [charIndex, deleting, exampleIndex, focused, reducedMotion, value.length]);

  const showOverlay = value.length === 0 && !focused;
  const overlayText = reducedMotion
    ? (heroSearchExamples[0] ?? STATIC_PLACEHOLDER)
    : displayText;

  const navigateToQuery = (query: string) => {
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    pushRecent(trimmed);
    setFocused(false);
    router.push(buildBrowseHrefFromQuery(trimmed));
  };

  const navigateToCourse = (course: SearchSuggestCourse) => {
    const href = buildBrowseHref({
      courseId: course.id,
      ...detectedFilters,
    });
    const trimmed = value.trim();

    if (trimmed.length >= 2) {
      pushRecent(trimmed);
    }

    setFocused(false);
    router.push(href);
  };

  const submitQuery = () => {
    const trimmed = value.trim();

    if (!trimmed) {
      router.push("/pascos");
      return;
    }

    if (activeIndex >= 0) {
      if (showRecents && activeIndex < recents.length) {
        navigateToQuery(recents[activeIndex] ?? "");
        return;
      }

      const courseIndex = showRecents
        ? activeIndex - recents.length
        : activeIndex;
      const course = courses[courseIndex];

      if (course) {
        navigateToCourse(course);
        return;
      }
    }

    navigateToQuery(trimmed);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitQuery();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || selectableCount === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, selectableCount - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Escape") {
      setFocused(false);
      setActiveIndex(-1);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
    >
      <div ref={containerRef} className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            if (
              containerRef.current?.contains(event.relatedTarget as Node | null)
            ) {
              return;
            }

            window.setTimeout(() => setFocused(false), 150);
          }}
          onKeyDown={handleKeyDown}
          aria-label={heroCopy.searchAriaLabel}
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listboxId : undefined}
          aria-autocomplete="list"
          role="combobox"
          placeholder=" "
          className="h-11 pl-9"
        />
        {showOverlay ? (
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 left-9 -translate-y-1/2 truncate text-sm text-muted-foreground",
              !reducedMotion && "after:animate-pulse after:content-['|']",
            )}
            aria-hidden
          >
            {overlayText}
          </span>
        ) : null}

        {showDropdown ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
          >
            {showRecents ? (
              <RecentSearchesList
                searches={recents}
                activeIndex={activeIndex}
                onSelect={navigateToQuery}
                onRemove={removeRecent}
              />
            ) : null}

            {showSuggestions && hasDetectedFilters ? (
              <div className="border-b px-3 py-2">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Detected filters
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(detectedFilters).map(([key, filterValue]) => {
                    if (typeof filterValue !== "string") {
                      return null;
                    }

                    return (
                      <span
                        key={key}
                        className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                      >
                        {formatFilterChipLabel(key, filterValue)}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {showSuggestions && suggestQuery.isFetching ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Searching…
              </p>
            ) : null}

            {showSuggestions && courses.length > 0 ? (
              <ul className="max-h-64 overflow-y-auto py-1">
                {courses.map((course, index) => {
                  const optionIndex = showRecents
                    ? recents.length + index
                    : index;

                  return (
                    <li key={course.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={optionIndex === activeIndex}
                        className={cn(
                          "flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted",
                          optionIndex === activeIndex && "bg-muted",
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => navigateToCourse(course)}
                      >
                        <span className="font-medium">
                          {course.code} — {course.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {course.institutionName} · {course.pascoCount} pasco
                          {course.pascoCount === 1 ? "" : "s"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {showSuggestions &&
            !suggestQuery.isFetching &&
            courses.length === 0 &&
            !hasDetectedFilters ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No courses found. Press Search to browse anyway.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <Button type="submit" className="h-11 min-w-28">
        Search
      </Button>
    </form>
  );
}
