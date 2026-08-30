"use client";

import { Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteName } from "@/config/site";
import { usePwaInstall } from "@/hooks/use-pwa-install";

function isIOS(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !("MSStream" in window)
  );
}

export function PwaInstallButton() {
  const { hasNativePrompt, isInstalled, isStandalone, promptInstall } =
    usePwaInstall();
  const [mounted, setMounted] = useState(false);
  const [showIOSDialog, setShowIOSDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback(async () => {
    if (hasNativePrompt) {
      await promptInstall();
    } else if (isIOS()) {
      setShowIOSDialog(true);
    }
  }, [hasNativePrompt, promptInstall]);

  if (!mounted || isStandalone || isInstalled) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="min-h-11 min-w-11 lg:min-h-0 lg:min-w-0"
        onClick={handleClick}
      >
        <Download className="size-4" />
        <span className="sr-only">Install app</span>
      </Button>

      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install {siteName}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>To install this app on your iPhone or iPad:</p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>
                    Tap the Share button <span aria-hidden>&#x2398;</span> in
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
