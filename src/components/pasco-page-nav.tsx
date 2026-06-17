import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type PascoPageNavProps = {
  href?: string;
  label?: string;
  ariaLabel?: string;
  className?: string;
};

export function PascoPageNav({
  href = "/pascos",
  label = "Back to browse",
  ariaLabel = "Back navigation",
  className,
}: PascoPageNavProps) {
  return (
    <nav className={cn(className)} aria-label={ariaLabel}>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {label}
      </Link>
    </nav>
  );
}
