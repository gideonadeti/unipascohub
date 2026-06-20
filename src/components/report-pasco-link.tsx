"use client";

import { Flag } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { buildPascoReportHref } from "@/lib/feedback-links";

function subscribe() {
  return () => {};
}

function getPageUrl() {
  return window.location.href.split("#")[0] ?? "";
}

function getServerPageUrl() {
  return "";
}

type ReportPascoLinkProps = {
  pascoId: string;
};

export function ReportPascoLink({ pascoId }: ReportPascoLinkProps) {
  const pageUrl = useSyncExternalStore(subscribe, getPageUrl, getServerPageUrl);
  const href = buildPascoReportHref(pascoId, pageUrl || `/pascos/${pascoId}`);

  if (!href) {
    return null;
  }

  return (
    <Button variant="outline" size="sm" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Flag className="size-4" aria-hidden />
        Report
      </a>
    </Button>
  );
}
