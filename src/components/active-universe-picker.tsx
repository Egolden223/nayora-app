import { useState } from "react";
import { Check } from "lucide-react";
import type { Profile } from "@/lib/dating";
import { setActiveUniverse } from "@/lib/dating";
import { useLang } from "@/lib/lang";

/** Sélecteur d'univers actif dans le profil (Mes univers). */
export function ActiveUniversePicker({
  me,
  onReload,
}: {
  me: Profile;
  onReload: () => void;
}) {
  const { t } = useLang();
  const primary =
    (me.universes ?? [])[0] ?? me.intention ?? "mariage";
  const all = me.universes?.length ? me.universes : [primary];
  const [busy, setBusy] = useState(false);

  const activate = async (u: string) => {
    if (u === primary || busy) return;
    setBusy(true);
    try {
      await setActiveUniverse({ data: { universe: u } });
      onReload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 w-full max-w-sm space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {t("myUniverses")}
      </p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t("activeUniverseHint")}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {all.map((u) => {
          const active = u === primary;
          return (
            <button
              key={u}
              type="button"
              disabled={busy || active}
              onClick={() => void activate(u)}
              className={
                active
                  ? "inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary"
                  : "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40"
              }
            >
              {active && <Check className="size-3" />}
              {t(u)}
              {active ? ` · ${t("activeUniverse")}` : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
