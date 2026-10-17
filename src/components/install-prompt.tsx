import { migrateLegacyStorage } from "@/lib/storage-migrate";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "rayine:install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Banner installer PWA RAYINE (Android beforeinstallprompt / iOS Share). */
export function InstallPrompt() {
  const { t } = useLang();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    migrateLegacyStorage();
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;
    setDismissed(false);
    setIos(isIos());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => setDismissed(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  if (dismissed) return null;
  if (!ios && !deferred) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-black/10 dark:bg-white/10">
        {ios ? <Share className="size-4" /> : <Download className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t("installTitle")}</p>
        <p className="truncate text-xs text-muted-foreground">
          {ios ? t("installIos") : t("installAndroid")}
        </p>
      </div>
      {!ios && deferred && (
        <Button
          size="sm"
          onClick={async () => {
            await deferred.prompt();
            const { outcome } = await deferred.userChoice;
            setDeferred(null);
            if (outcome === "accepted") setDismissed(true);
          }}
        >
          {t("install")}
        </Button>
      )}
      <button
        type="button"
        aria-label={t("installDismiss")}
        onClick={dismiss}
        className="shrink-0 cursor-pointer p-1 opacity-60 hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
