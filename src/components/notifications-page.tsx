"use client";

import { useCallback, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  useDeleteNotification,
  useMarkNotificationRead,
  useNotificationsList,
} from "@/hooks/api/use-notifications";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Tab = "all" | "unread";

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

const PAGE_SIZE = 20;

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const notificationsQuery = useNotificationsList({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    unreadOnly: activeTab === "unread",
  });
  const markReadMutation = useMarkNotificationRead();
  const deleteMutation = useDeleteNotification();

  const notifications = notificationsQuery.data?.notifications ?? [];
  const totalCount = notificationsQuery.data?.totalCount ?? 0;
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const hasMore = page * PAGE_SIZE + notifications.length < totalCount;

  const handleMarkRead = useCallback(
    (id: string) => {
      markReadMutation.mutate(id);
    },
    [markReadMutation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
      setDeletingId(null);
    },
    [deleteMutation],
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActiveTab(tab.value);
              setPage(0);
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.value === "all" && unreadCount > 0 ? (
              <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* List */}
      {notificationsQuery.isPending ? (
        <div className="flex justify-center py-12">
          <Spinner aria-hidden />
        </div>
      ) : notifications.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {activeTab === "unread"
            ? "No unread notifications."
            : "No notifications yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                !notification.readAt &&
                  "border-l-2 border-l-primary bg-muted/30",
              )}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {!notification.readAt ? (
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                  <p
                    className={cn(
                      "text-sm",
                      !notification.readAt
                        ? "font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    {notification.title}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {notification.body}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(notification.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!notification.readAt ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs"
                    disabled={markReadMutation.isPending}
                    onClick={() => handleMarkRead(notification.id)}
                  >
                    Mark read
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs text-destructive hover:text-destructive"
                  onClick={() => setDeletingId(notification.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalCount > PAGE_SIZE ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {Math.ceil(totalCount / PAGE_SIZE)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      {/* Delete confirmation */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The notification will be permanently
              removed from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              {deleteMutation.isPending ? <Spinner aria-hidden /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
