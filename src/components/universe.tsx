import { UNIVERSES } from "@/lib/constants";
import { UNIVERSE_ICONS } from "@/lib/universe-icons";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

export function UniverseBar({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const { t } = useLang();
  const items: string[] = ["all", ...UNIVERSES];
  return (
    <div
      role="tablist"
      aria-label={t("intention")}
      className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1", className)}
    >
      {items.map((key) => {
        const Icon = UNIVERSE_ICONS[key];
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            {Icon && <Icon className="size-3.5" strokeWidth={1.8} />}
            {key === "all" ? t("universeAll") : t(key)}
          </button>
        );
      })}
    </div>
  );
}
