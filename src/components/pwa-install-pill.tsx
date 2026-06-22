"use client";

import { Download, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteName } from "@/config/site";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function isIOS(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !("MSStream" in window)
  );
}

const DISMISS_KEY = "pwa-pill-dismissed";

export function PwaInstallPill() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSDialog, setShowIOSDialog] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  }, []);

  const handleClick = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS()) {
      setShowIOSDialog(true);
    }
  }, [deferredPrompt]);

  const canShow = !isStandalone && !dismissed;

  return (
    <>
      {canShow ? (
        <div
          className={cn(
            "fixed bottom-20 left-4 z-50 flex items-center gap-1.5",
            "lg:bottom-4",
          )}
        >
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-full",
              "bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-lg",
              "transition-transform hover:scale-105 active:scale-95",
            )}
          >
            <Download className="size-3.5" aria-hidden />
            Get the app
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className={cn(
              "flex size-7 items-center justify-center rounded-full",
              "bg-muted text-muted-foreground shadow transition-colors hover:bg-border",
            )}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}

      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install {siteName}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>To install this app on your iPhone or iPad:</p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>
                    Tap the Share button <span aria-hidden>&#x2399;</span> in
                    Safari
                  </li>
                  <li>
                    Scroll down and tap <strong>Add to Home Screen</strong>
                  </li>
                  <li>
                    Tap <strong>Add</strong> in the top-right corner
                  </li>
                </ol>
                <p className="pt-2 text-xs">
                  {siteName} will appear on your home screen just like a native
                  app.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
