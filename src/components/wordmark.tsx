import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

/**
 * NAYORA wordmark.
 * - compact (header app) : pictogramme + « AYORA » → NAYORA sans double N
 * - default : pictogramme + AYORA côte à côte + slogan
 * - auth (page login/inscription uniquement) : logo officiel empilé
 *   pictogramme au-dessus + « NAYORA » en toutes lettres + slogan
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
  /** `auth` = logo officiel empilé, réservé à /login */
  variant?: "default" | "auth";
}) {
  const { t } = useLang();

  if (variant === "auth") {
    return (
      <span
        className={cn("inline-flex flex-col items-center gap-3", className)}
        aria-label="NAYORA"
      >
        <img
          src="/nayora-mark.png"
          alt=""
          className="h-16 w-auto shrink-0 sm:h-20"
          aria-hidden
        />
        <span
          className={cn(
            "font-display text-3xl font-medium uppercase tracking-[0.32em] text-foreground sm:text-4xl",
            markClassName,
          )}
        >
          Nayora
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

  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5", className)}
        aria-label="NAYORA"
      >
        <img
          src="/nayora-mark.png"
          alt=""
          className="h-8 w-auto shrink-0"
          aria-hidden
        />
        <span
          className={cn(
            "font-display text-xl font-medium uppercase tracking-[0.28em] text-foreground",
            markClassName,
          )}
        >
          Ayora
        </span>
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex flex-col items-center gap-3", className)}
      aria-label="NAYORA"
    >
      <span className="inline-flex items-center gap-2">
        <img
          src="/nayora-mark.png"
          alt=""
          className="h-12 w-auto shrink-0 sm:h-14"
          aria-hidden
        />
        <span
          className={cn(
            "font-display text-4xl font-medium uppercase tracking-[0.28em] text-foreground",
            markClassName,
          )}
        >
          Ayora
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
