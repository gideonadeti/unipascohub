"use client";

import {
  AlertTriangle,
  Archive,
  BookOpen,
  Bug,
  LibraryBig,
  Lightbulb,
  MessageSquareText,
  Star,
} from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  useModerationFeedbackList,
  useUpdateFeedbackStatus,
} from "@/hooks/api/use-feedback";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type {
  FeedbackCategory,
  FeedbackItem,
  FeedbackStatus,
} from "@/types/api/feedback";

type StatusTab = FeedbackStatus;

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "READ", label: "Read" },
  { value: "ARCHIVED", label: "Archived" },
];

const CATEGORY_ICONS: Record<FeedbackCategory, typeof Bug> = {
  BUG_REPORT: Bug,
  CONTENT_ISSUE: AlertTriangle,
  FEATURE_REQUEST: Lightbulb,
  GENERAL: MessageSquareText,
  TESTIMONIAL: Star,
};

const CATEGORY_OPTIONS: { value: FeedbackCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All categories" },
  { value: "BUG_REPORT", label: "Bug Report" },
  { value: "CONTENT_ISSUE", label: "Content Issue" },
  { value: "FEATURE_REQUEST", label: "Feature Request" },
  { value: "GENERAL", label: "General" },
  { value: "TESTIMONIAL", label: "Testimonial" },
];

function FeedbackCategoryIcon({
  category,
  className,
}: {
  category: FeedbackCategory;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category];

  return <Icon className={cn("size-4", className)} aria-hidden />;
}

const CATEGORY_COLORS: Record<FeedbackCategory, string> = {
  BUG_REPORT: "text-red-500",
  CONTENT_ISSUE: "text-orange-500",
  FEATURE_REQUEST: "text-blue-500",
  GENERAL: "text-muted-foreground",
  TESTIMONIAL: "text-amber-500",
};

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const [expanded, setExpanded] = useState(false);
  const updateStatus = useUpdateFeedbackStatus();

  const isNew = item.status === "NEW";

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isNew && "border-l-2 border-l-primary bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              <FeedbackCategoryIcon
                category={item.category}
                className={CATEGORY_COLORS[item.category]}
              />
              {item.category
                .toLowerCase()
                .replaceAll("_", " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(item.createdAt)}
            </span>
          </div>

          <p className="text-sm font-medium">{item.subject}</p>

          <p
            className={cn(
              "text-xs text-muted-foreground",
              !expanded && "line-clamp-2",
            )}
          >
            {item.message}
          </p>

          {item.message.length > 100 ? (
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {item.contactEmail ? (
              <span className="text-xs text-muted-foreground">
                Contact: {item.contactEmail}
              </span>
            ) : null}
            {item.userName ? (
              <span className="text-xs text-muted-foreground">
                User: {item.userName}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-1">
          {isNew ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              disabled={updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate({
                  feedbackId: item.id,
                  status: "READ",
                })
              }
            >
              <BookOpen className="mr-1 size-3" aria-hidden />
              Read
            </Button>
          ) : null}
          {item.status !== "ARCHIVED" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              disabled={updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate({
                  feedbackId: item.id,
                  status: "ARCHIVED",
                })
              }
            >
              <Archive className="mr-1 size-3" aria-hidden />
              Archive
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export function ModerationFeedbackPage() {
  const [statusTab, setStatusTab] = useState<StatusTab>("NEW");
  const [categoryFilter, setCategoryFilter] = useState<
    FeedbackCategory | "ALL"
  >("ALL");
  const [page, setPage] = useState(1);

  const feedbackQuery = useModerationFeedbackList({
    status: statusTab,
    category: categoryFilter === "ALL" ? undefined : categoryFilter,
    page,
    limit: PAGE_SIZE,
  });

  if (feedbackQuery.isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" aria-label="Loading feedback" />
      </div>
    );
  }

  if (feedbackQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load feedback</AlertTitle>
        <AlertDescription>{feedbackQuery.error.message}</AlertDescription>
      </Alert>
    );
  }

  const { feedback, totalCount } = feedbackQuery.data;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={statusTab === tab.value ? "default" : "outline"}
            onClick={() => {
              setStatusTab(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value as FeedbackCategory | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Feedback list */}
      {feedback.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <LibraryBig className="size-8" aria-hidden />
          <p>No feedback in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
