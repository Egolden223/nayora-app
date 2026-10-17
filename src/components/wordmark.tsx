import { cn } from "@/lib/utils";

/**
 * RAYINE wordmark.
 * - compact  → logo horizontal (en-tête de toutes les pages app)
 * - default / hero → logo vertical (accueil splash, suspension)
 * - auth → logo vertical (page connexion)
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
  /** `auth` = page login ; `default` = splash / hero */
  variant?: "default" | "auth";
}) {
  // En-tête app : logo horizontal officiel
  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center", className)}
        aria-label="RAYINE"
      >
        <img
          src="/rayine-logo-horizontal.svg"
          alt="RAYINE — Connecter autrement."
          className="h-8 w-auto max-w-[min(100%,220px)] shrink-0 object-contain object-left sm:h-9"
        />
      </span>
    );
  }

  // Accueil / login / hero : logo vertical
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
