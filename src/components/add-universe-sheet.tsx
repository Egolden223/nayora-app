import { useState } from "react";
import type { Profile } from "@/lib/dating";
import { addUniverseProfile } from "@/lib/dating";
import { INTENTIONS } from "@/lib/constants";
import { UNIVERSE_ICONS } from "@/lib/universe-icons";
import { useLang } from "@/lib/lang";
import { UniverseProfileForm } from "@/components/universe-form";
import { Button } from "@/components/ui/button";
import type { UniverseData } from "@/lib/universe-match";
import { cn } from "@/lib/utils";

/**
 * Ajout d'un sous-profil : un seul univers à la fois.
 * Pas de re-saisie des infos de base (naissance, photo…).
 * Uniquement le formulaire spécifique à l'univers choisi.
 */
export function AddUniverseSheet({
  me,
  onClose,
  onDone,
}: {
  me: Profile;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useLang();
  const owned = new Set(me.universes?.length ? me.universes : [me.intention || "mariage"]);
  const available = INTENTIONS.filter((u) => !owned.has(u));
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [chosen, setChosen] = useState<string | null>(null);
  const [universeData, setUniverseData] = useState<UniverseData>(me.universeData ?? {});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = (u: string) => {
    setChosen(u);
    setStep("form");
    setErr(null);
  };

  const save = async (activate: boolean) => {
    if (!chosen || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await addUniverseProfile({
        data: { universe: chosen, universeData, activate },
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("authError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-plum/60 sm:items-center sm:justify-center">
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border border-border bg-card sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-display text-2xl">{t("addUniverseTitle")}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {step === "pick" ? t("addUniversePickLead") : t("addUniverseFormLead")}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground">
            {t("cancel")}
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("addUniverseNoneLeft")}</p>
          ) : step === "pick" ? (
            <div className="grid grid-cols-1 gap-2.5">
              {available.map((key) => {
                const Icon = UNIVERSE_ICONS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pick(key)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3.5 text-left transition-colors hover:border-primary/40",
                    )}
                  >
                    {Icon && <Icon className="size-5 shrink-0 text-primary" strokeWidth={1.7} />}
                    <div>
                      <p className="font-medium">{t(key)}</p>
                      <p className="text-[11px] text-muted-foreground">{t(`uDesc_${key}`)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            chosen && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setStep("pick");
                    setChosen(null);
                  }}
                  className="text-xs text-primary"
                >
                  ← {t("addUniverseBack")}
                </button>
                <p className="text-sm font-medium text-primary">{t(chosen)}</p>
                <UniverseProfileForm
                  universes={[chosen]}
                  data={universeData}
                  onChange={setUniverseData}
                />
                {err && <p className="text-sm text-destructive">{err}</p>}
                <div className="grid gap-2 pt-2">
                  <Button disabled={busy} onClick={() => void save(true)}>
                    {busy ? "…" : t("addUniverseSaveAndActivate")}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void save(false)}
                  >
                    {t("addUniverseSaveOnly")}
                  </Button>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
