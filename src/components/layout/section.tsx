import type { ReactNode } from "react";

import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

type SectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Section({
  title,
  description,
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {title || description ? (
        <div className="space-y-1">
          {title ? <h2 className={typography.h2}>{title}</h2> : null}
          {description ? (
            <p className={cn(typography.body, "text-muted-foreground")}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
