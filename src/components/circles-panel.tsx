import { Lock, MapPin, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";
import { getMyCircles, joinCircleQueue, leaveCircle, leaveCircleQueue, type MyCircles } from "@/lib/services";

/** « Mes cercles » : groupes de 4 à 6 personnes composés selon les intérêts, lieu dévoilé quelques heures avant. */
export function CirclesSection() {
  const { t, lang } = useLang();
  const [data, setData] = useState<MyCircles | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => setData(await getMyCircles()), []);
  useEffect(() => {
    void load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(false);
    try {
      await fn();
      await load();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(lang, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  if (!data) return null;
  return (
    <section className="mb-8 rounded-[24px] border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 font-display text-2xl font-medium">
        <Users className="size-5 text-primary" />
        {t("circlesTitle")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("circlesLead")}</p>

      {data.circles.map((c) => (
        <div key={c.id} className="mt-3 rounded-2xl border border-border bg-background p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{c.title}</p>
            {c.womenOnly && <Badge tone="primary">{t("circlesWomenBadge")}</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{fmt(c.startsAt)}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs">
            {c.venueRevealed ? (
              <>
                <MapPin className="size-3.5 text-primary" />
                {c.venue ?? t("circlesVenuePending")}
              </>
            ) : (
              <>
                <Lock className="size-3.5 text-primary" />
                {t("circlesVenueSoon")} {fmt(c.revealAt)}
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("circlesMembers")} : {c.members.map((m) => `${m.firstName} (${m.ageBand})`).join(" · ")}
          </p>
          <Button size="sm" variant="ghost" className="mt-1" disabled={busy} onClick={() => run(() => leaveCircle({ data: { circleId: c.id } }))}>
            {t("circlesLeaveCircle")}
          </Button>
        </div>
      ))}

      {data.waiting ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-primary">{t("circlesWaiting")}</p>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => leaveCircleQueue())}>
            {t("circlesLeave")}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => run(() => joinCircleQueue({ data: { womenOnly: false } }))}>
            {t("circlesJoinMixed")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !data.canWomenOnly}
            onClick={() => run(() => joinCircleQueue({ data: { womenOnly: true } }))}
          >
            {t("circlesJoinWomen")}
          </Button>
          {!data.canWomenOnly && <p className="w-full text-[11px] text-muted-foreground">{t("circlesWomenRule")}</p>}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{t("meetingError")}</p>}
      {!data.circles.length && !data.waiting && <p className="mt-2 text-xs text-muted-foreground">{t("circlesNone")}</p>}
    </section>
  );
}
