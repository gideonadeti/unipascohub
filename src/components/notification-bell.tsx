"use client";

import { Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { subscribeUser, unsubscribeUser } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from "@/hooks/api/use-notifications";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

export function NotificationBell() {
  const notificationsQuery = useNotificationsList({ limit: 20 });
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setIsPushSupported(true);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(sub !== null))
      .catch(() => {});
  }, []);

  const handleSubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
        ) as BufferSource,
      });
      setIsSubscribed(true);
      await subscribeUser(JSON.parse(JSON.stringify(sub)));
    } catch {
      // subscription failed
    }
  }, []);

  const handleUnsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await unsubscribeUser(endpoint);
      }
      setIsSubscribed(false);
    } catch {
      // unsubscribe failed
    }
  }, []);

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const notifications = notificationsQuery.data?.notifications ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative min-h-11 min-w-11 sm:min-h-0 sm:min-w-0"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          <Bell className="size-4" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all read
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notificationsQuery.isPending ? (
          <div className="flex justify-center py-6">
            <Spinner aria-hidden />
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "flex cursor-pointer flex-col items-start gap-1 p-3",
                !notification.readAt && "bg-muted/50",
              )}
              onClick={() => {
                if (!notification.readAt) {
                  markReadMutation.mutate(notification.id);
                }
              }}
              asChild
            >
              <Link href={notification.link ?? "/moderation/pascos"}>
                <span className="text-sm font-medium">
                  {notification.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {notification.body}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(notification.createdAt)}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        {isPushSupported ? (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                {isSubscribed ? (
                  <BellOff className="size-4 text-muted-foreground" />
                ) : (
                  <Bell className="size-4 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">
                  {isSubscribed
                    ? "Push notifications on"
                    : "Push notifications"}
                </span>
              </div>
              {isSubscribed ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={handleUnsubscribe}
                >
                  Turn off
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-auto px-3 py-1 text-xs"
                  onClick={handleSubscribe}
                >
                  Enable
                </Button>
              )}
            </div>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
