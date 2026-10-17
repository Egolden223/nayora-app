import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

/**
 * RAYINE wordmark.
 * - compact → en-tête (logo horizontal SVG sombre, ou mark+texte en clair)
 * - default / auth → vertical (SVG sombre, ou mark+texte empilé en clair)
 * Assets brand kit : sur-fonce (thème sombre), rendu CSS (thème clair).
 */
export function Wordmark({
  className,
  markClassName,
  compact,
  tagline: _tagline = true,
  variant = "default",
}: {
  className?: string;
  markClassName?: string;
  compact?: boolean;
  tagline?: boolean;
  variant?: "default" | "auth";
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  if (compact) {
    if (isLight) {
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
        className={cn("inline-flex items-center", className)}
        aria-label="RAYINE"
      >
        <img
          src="/rayine-logo-horizontal.svg"
          alt="RAYINE — Connecter autrement."
          className="h-10 w-auto max-w-[min(100%,240px)] shrink-0 object-contain object-left sm:h-11"
        />
      </span>
    );
  }

  // Hero / login vertical
  if (isLight) {
    return (
      <span
        className={cn("inline-flex flex-col items-center gap-3", className)}
        aria-label="RAYINE"
      >
        <img
          src="/rayine-mark.svg"
          alt=""
          className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
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
        <span className="text-xs tracking-[0.12em] text-primary">
          Connecter autrement.
        </span>
      </span>
    );
  }

  const sizeClass =
    variant === "auth"
      ? "h-28 w-auto max-w-[min(100%,200px)] sm:h-32"
      : "h-36 w-auto max-w-[min(100%,240px)] sm:h-44";

  return (
    <span
      className={cn("inline-flex flex-col items-center", className)}
      aria-label="RAYINE"
    >
      <img
        src="/rayine-logo-vertical.svg"
        alt="RAYINE — Connecter autrement."
        className={cn("shrink-0 object-contain", sizeClass)}
      />
    </span>
  );
}
