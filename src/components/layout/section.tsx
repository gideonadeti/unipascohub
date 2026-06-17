import type { ReactNode } from "react";
import { useId } from "react";

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
  const titleId = useId();

  return (
    <section
      className={cn("space-y-4", className)}
      aria-labelledby={title ? titleId : undefined}
    >
      {title || description ? (
        <div className="space-y-1">
          {title ? (
            <h2 id={titleId} className={typography.h2}>
              {title}
            </h2>
          ) : null}
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
