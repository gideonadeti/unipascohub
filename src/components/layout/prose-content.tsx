import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ProseContentProps = {
  children: ReactNode;
  className?: string;
};

export function ProseContent({ children, className }: ProseContentProps) {
  return (
    <div
      className={cn(
        "max-w-none space-y-4 text-sm text-muted-foreground sm:text-base [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
