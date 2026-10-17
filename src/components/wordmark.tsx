import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

/**
 * RAYINE wordmark.
 * - compact (header app) : symbole + « RAYINE »
 * - default : symbole + RAYINE + slogan
 * - auth (login) : logo horizontal officiel + slogan
 */
export function Wordmark({
  className,
  markClassName,
  compact,
  tagline = true,
  variant = "default",
}: {
  className?: string;
  markClassName?: string;
  compact?: boolean;
  tagline?: boolean;
  /** `auth` = logo officiel, réservé à /login */
  variant?: "default" | "auth";
}) {
  const { t } = useLang();

  if (variant === "auth") {
    return (
      <span
        className={cn("inline-flex flex-col items-center gap-3", className)}
        aria-label="RAYINE"
      >
        <img
          src="/rayine-logo-horizontal.svg"
          alt=""
          className="h-14 w-auto max-w-[min(100%,280px)] shrink-0 sm:h-16"
          aria-hidden
        />
        {tagline && (
          <span className="flex items-center gap-3 text-xs tracking-[0.12em] text-primary">
            <span aria-hidden className="h-px w-8 bg-primary/70" />
            {t("appTagline")}
            <span aria-hidden className="h-px w-8 bg-primary/70" />
          </span>
        )}
      </span>
    );
  }

  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center gap-2", className)}
        aria-label="RAYINE"
      >
        <img
          src="/rayine-mark.svg"
          alt=""
          className="h-8 w-8 shrink-0 object-contain"
          aria-hidden
        />
        <span
          className={cn(
            "font-display text-xl font-medium uppercase tracking-[0.28em] text-foreground",
            markClassName,
          )}
        >
          Rayine
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex flex-col items-center gap-3", className)}
      aria-label="RAYINE"
    >
      <span className="inline-flex items-center gap-2.5">
        <img
          src="/rayine-mark.svg"
          alt=""
          className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
          aria-hidden
        />
        <span
          className={cn(
            "font-display text-4xl font-medium uppercase tracking-[0.28em] text-foreground sm:text-5xl",
            markClassName,
          )}
        >
          Rayine
        </span>
      </span>
      {tagline && (
        <span className="flex items-center gap-3 text-xs tracking-[0.12em] text-primary">
          <span aria-hidden className="h-px w-8 bg-primary/70" />
          {t("appTagline")}
          <span aria-hidden className="h-px w-8 bg-primary/70" />
        </span>
      )}
    </span>
  );
}
