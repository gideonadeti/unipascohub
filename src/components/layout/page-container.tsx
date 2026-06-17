import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const widthClasses = {
  narrow: "max-w-2xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

type PageContainerProps = {
  width?: keyof typeof widthClasses;
  className?: string;
  children: ReactNode;
};

export function PageContainer({
  width = "default",
  className,
  children,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full flex-1 px-4 py-6 sm:px-6",
        widthClasses[width],
        className,
      )}
    >
      {children}
    </main>
  );
}
