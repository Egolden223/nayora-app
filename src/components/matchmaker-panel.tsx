import { HeartHandshake } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/lang";
import { listMyMatchmakerRequests, type MatchmakerRequest, requestMatchmaker } from "@/lib/services";

/** Accompagnement humain Prestige : entremise (profils choisis à la main) et préparation au mariage. */
export function MatchmakerSection({ isPremium }: { isPremium: boolean }) {
  const { t } = useLang();
  const [requests, setRequests] = useState<MatchmakerRequest[]>([]);
  const [kind, setKind] = useState<"entremise" | "preparation">("entremise");
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => setRequests(await listMyMatchmakerRequests()), []);
  useEffect(() => {
    if (isPremium) void load();
  }, [isPremium, load]);

  return (
    <section className="mt-6 rounded-[24px] border border-primary/40 bg-card p-4">
      <h2 className="flex items-center gap-2 font-display text-2xl font-medium">
        <HeartHandshake className="size-5 text-primary" />
        {t("mmTitle")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("mmLead")}</p>
      {!isPremium ? (
        <p className="mt-3 text-sm text-primary">{t("mmPremiumOnly")}</p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2">
            {(["entremise", "preparation"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={`rounded-2xl border p-3 text-left text-sm ${kind === k ? "border-primary bg-background" : "border-border"}`}
              >
                {t(`mm_${k}`)}
              </button>
            ))}
          </div>
          <Textarea rows={3} maxLength={500} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder={t("mmBrief")} />
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await requestMatchmaker({ data: { kind, brief } });
                setSent(true);
                setBrief("");
                await load();
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("mmSend")}
          </Button>
          {sent && <p className="text-xs text-primary">{t("mmSent")}</p>}
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-xs">
              <span>{t(`mmShort_${r.kind}`)}</span>
              <Badge>{t(`mmStatus_${r.status}`)}</Badge>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
