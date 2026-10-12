import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const WASHES = [
  "from-[#1a2b45] via-[#0f1a2b] to-[#c9a45c]/30",
  "from-[#172740] via-[#1b2e4a] to-[#d8c7a5]/25",
  "from-[#0f1a2b] via-[#1a2b45] to-[#c9a45c]/35",
  "from-[#1b2e4a] via-[#101c2c] to-[#d8c7a5]/20",
  "from-[#1a2b45]/80 via-[#0f1a2b] to-[#f5f0e7]/10",
  "from-[#0f1a2b] via-[#223653] to-[#c9a45c]/30",
];

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function initials(name?: string | null) {
  if (!name) return "A";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfilePhoto({
  name,
  seed,
  photoUrl,
  className,
  textClassName,
  hidden,
}: {
  name?: string | null;
  seed: string;
  /** Real uploaded photo, when there is one — takes over the whole avatar. */
  photoUrl?: string | null;
  /** La photo est la version floutée (le membre la dévoile au match) : on ajoute un cadenas. */
  hidden?: boolean;
  className?: string;
  textClassName?: string;
}) {
  if (photoUrl) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <img
          src={photoUrl}
          alt={name ?? ""}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {hidden && (
          <span className="absolute bottom-2 right-2 grid size-7 place-items-center rounded-full bg-background/70 text-primary backdrop-blur">
            <Lock className="size-3.5" aria-hidden />
          </span>
        )}
      </div>
    );
  }

  const g = WASHES[hash(seed) % WASHES.length] ?? WASHES[0];
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden bg-gradient-to-br",
        g,
        className,
      )}
      aria-label={name ?? ""}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(247,242,228,0.18), transparent 42%), radial-gradient(circle at 80% 80%, rgba(242,183,5,0.28), transparent 46%)",
        }}
      />
      <span
        className={cn(
          "relative font-display font-medium text-cream/90",
          textClassName,
        )}
      >
        {initials(name)}
      </span>
    </div>
  );
}
