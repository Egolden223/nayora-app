import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { Profile } from "@/lib/dating";
import { setActiveUniverse } from "@/lib/dating";
import { INTENTIONS } from "@/lib/constants";
import { useLang } from "@/lib/lang";
import { AddUniverseSheet } from "@/components/add-universe-sheet";

/** Sélecteur d'univers actif + bouton pour ajouter un sous-profil. */
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
  const [addOpen, setAddOpen] = useState(false);
  const canAdd = INTENTIONS.some((u) => !all.includes(u));

  const activate = async (u: string) => {
    if (u === primary || busy) return;
    const label = t(u);
    const msg = t("switchUniverseConfirm").replace("{universe}", label);
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await setActiveUniverse({ data: { universe: u } });
      onReload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mt-4 w-full max-w-sm space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {t("myUniverses")}
          </p>
          {canAdd && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              <Plus className="size-3" strokeWidth={2.2} />
              {t("addUniverse")}
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
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

      {addOpen && (
        <AddUniverseSheet
          me={me}
          onClose={() => setAddOpen(false)}
          onDone={() => {
            setAddOpen(false);
            onReload();
          }}
        />
      )}
    </>
  );
}
