import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

/**
 * RAYINE wordmark.
 * - compact  → logo horizontal (en-tête)
 * - default / auth → logo vertical (accueil / login)
 * Logos sur-fonce (thème sombre) ou sur-clair (thème clair).
 */
export function Wordmark({
  className,
  markClassName: _markClassName,
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
  const horizontalSrc = isLight
    ? "/rayine-logo-horizontal-light.svg"
    : "/rayine-logo-horizontal.svg";
  const verticalSrc = isLight
    ? "/rayine-logo-vertical-light.svg"
    : "/rayine-logo-vertical.svg";

  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center", className)}
        aria-label="RAYINE"
      >
        <img
          src={horizontalSrc}
          alt="RAYINE — Connecter autrement."
          className="h-10 w-auto max-w-[min(100%,240px)] shrink-0 object-contain object-left sm:h-11"
        />
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
        src={verticalSrc}
        alt="RAYINE — Connecter autrement."
        className={cn("shrink-0 object-contain", sizeClass)}
      />
    </span>
  );
}
