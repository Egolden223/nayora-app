import { Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldSelect } from "@/components/field-select";
import type { ImpactStory } from "@/lib/dating";
import { useLang } from "@/lib/lang";
import { deleteImpactStory, saveImpactStory } from "@/lib/services";
import { PROJECT_CAUSES } from "@/lib/universe-match";

/** « Mon impact » (Projects & Learn) : 5 pages maximum, visibles sur le profil. */
export function ImpactSection({ initial }: { initial?: ImpactStory[] | null }) {
  const { t } = useLang();
  const [stories, setStories] = useState<ImpactStory[]>(() => initial ?? []);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [cause, setCause] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <section className="mt-6 w-full rounded-2xl border border-border bg-card p-4 text-left">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 text-primary" />
        {t("impactTitle")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("impactLead")}</p>
      {(stories ?? []).map((s, i) => (
        <div key={i} className="mt-3 flex items-start gap-2 rounded-xl bg-background p-3 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.summary}</p>
            {s.cause && <p className="mt-1 text-[11px] text-primary">{t(`cause_${s.cause}`)}</p>}
          </div>
          <button
            type="button"
            aria-label={t("impactDelete")}
            className="text-muted-foreground"
            onClick={async () => {
              const next = await deleteImpactStory({ data: { index: i } });
              setStories(Array.isArray(next) ? next : []);
            }}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      {(stories ?? []).length < 5 ? (
        <div className="mt-3 space-y-2">
          <Input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder={t("impactTitleField")} />
          <Textarea rows={2} maxLength={280} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={t("impactSummary")} />
          <FieldSelect value={cause} onChange={setCause}>
            <option value="">—</option>
            {PROJECT_CAUSES.map((c) => (
              <option key={c} value={c}>
                {t(`cause_${c}`)}
              </option>
            ))}
          </FieldSelect>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !title.trim() || !summary.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                const next = await saveImpactStory({ data: { title, summary, cause } });
                setStories(Array.isArray(next) ? next : []);
                setTitle("");
                setSummary("");
                setCause("");
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("impactAdd")}
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{t("impactMax")}</p>
      )}
    </section>
  );
}
