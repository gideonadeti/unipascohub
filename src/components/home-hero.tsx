"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

import { HeroSearch } from "@/components/hero-search";
import { Button } from "@/components/ui/button";
import { heroCopy } from "@/config/site";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function HomeHero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="py-8 text-center sm:py-12 lg:text-left"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 lg:mx-0 lg:items-start">
        <div className="space-y-3">
          <h1
            className={cn(
              typography.display,
              "bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent",
            )}
          >
            {heroCopy.headline}
          </h1>
          <p className={cn(typography.body, "text-muted-foreground")}>
            {heroCopy.subheadline}
          </p>
        </div>

        <HeroSearch />

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild className="h-11">
            <Link href="/pascos">Browse pascos</Link>
          </Button>
          <Button variant="outline" asChild className="h-11">
            <Link href="/pascos/new">Upload pasco</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
