"use client";

import { useCallback, useMemo, useState } from "react";

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
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useDeleteSelectedNotifications,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState<
    "all" | "selected" | null
  >(null);

  const notificationsQuery = useNotificationsList({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    unreadOnly: activeTab === "unread",
  });
  const markReadMutation = useMarkNotificationRead();
  const deleteMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();
  const deleteSelectedMutation = useDeleteSelectedNotifications();

  const notifications = notificationsQuery.data?.notifications ?? [];
  const totalCount = notificationsQuery.data?.totalCount ?? 0;
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const hasMore = page * PAGE_SIZE + notifications.length < totalCount;

  const currentPageIds = useMemo(
    () => new Set(notifications.map((n) => n.id)),
    [notifications],
  );

  const selectedCount = selectedIds.size;

  const allPageSelected = useMemo(
    () =>
      notifications.length > 0 &&
      notifications.every((n) => selectedIds.has(n.id)),
    [notifications, selectedIds],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of currentPageIds) {
          if (checked) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
        return next;
      });
    },
    [currentPageIds],
  );

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [deleteMutation],
  );

  const handleBulkDelete = useCallback(() => {
    if (bulkDeleteMode === "all") {
      deleteAllMutation.mutate(undefined, {
        onSuccess: () => {
          setSelectedIds(new Set());
          setBulkDeleteMode(null);
        },
      });
    } else if (bulkDeleteMode === "selected") {
      deleteSelectedMutation.mutate(Array.from(selectedIds), {
        onSuccess: () => {
          setSelectedIds(new Set());
          setBulkDeleteMode(null);
        },
      });
    }
  }, [bulkDeleteMode, selectedIds, deleteAllMutation, deleteSelectedMutation]);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setPage(0);
    setSelectedIds(new Set());
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const isDeletingBulk =
    deleteAllMutation.isPending || deleteSelectedMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
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

      {/* Toolbar */}
      {notifications.length > 0 ? (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={
              notifications.length > 0 &&
              (allPageSelected
                ? true
                : selectedCount > 0
                  ? "indeterminate"
                  : false)
            }
            onCheckedChange={(checked) => handleSelectAll(checked === true)}
            aria-label="Select all on this page"
          />
          <span className="text-sm text-muted-foreground">All</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeletingBulk}
              onClick={() => setBulkDeleteMode("all")}
            >
              Delete all
            </Button>
            {selectedCount > 0 ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeletingBulk}
                onClick={() => setBulkDeleteMode("selected")}
              >
                Delete selected ({selectedCount})
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

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
              <Checkbox
                checked={selectedIds.has(notification.id)}
                onCheckedChange={(checked) =>
                  handleSelectOne(notification.id, checked === true)
                }
                aria-label={`Select ${notification.title}`}
                className="mt-0.5"
              />
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
            onClick={() => handlePageChange(page - 1)}
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
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      {/* Single delete confirmation */}
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

      {/* Bulk delete confirmation */}
      <AlertDialog
        open={bulkDeleteMode !== null}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteMode(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkDeleteMode === "all"
                ? "Delete all notifications?"
                : `Delete ${selectedCount} notification${selectedCount === 1 ? "" : "s"}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkDeleteMode === "all"
                ? "This will permanently delete your entire notification history."
                : `This will permanently delete ${selectedCount} notification${selectedCount === 1 ? "" : "s"} from your history.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingBulk}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              disabled={isDeletingBulk}
              onClick={handleBulkDelete}
            >
              {isDeletingBulk ? (
                <>
                  <Spinner aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
