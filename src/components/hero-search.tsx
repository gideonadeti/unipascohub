"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { heroCopy, heroSearchExamples } from "@/config/site";
import { cn } from "@/lib/utils";

const STATIC_PLACEHOLDER = "Search by course, level, year…";
const TYPING_INTERVAL_MS = 80;
const PAUSE_AFTER_WORD_MS = 2000;

export function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/pascos");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={heroCopy.searchAriaLabel}
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
      </div>
      <Button type="submit" className="h-11 min-w-28">
        Search
      </Button>
    </form>
  );
}
