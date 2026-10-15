import { CalendarClock, Star, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/dating";
import { useLang } from "@/lib/lang";
import {
  listMeetings,
  MEETING_KINDS,
  type MeetingKind,
  type MeetingRow,
  proposeMeeting,
  respondMeeting,
  saveImpactStory,
  submitMeetingFeedback,
  submitTravelReview,
} from "@/lib/services";
import { cn } from "@/lib/utils";

/** Types de rencontre proposés = ceux dont les DEUX membres partagent l'univers (mentorat : objectifs complémentaires). */
export function availableKinds(me: Profile, other: Profile): MeetingKind[] {
  const meU = me.universes ?? [];
  const otherU = other.universes ?? [];
  const shared = (u: string) => meU.includes(u) && otherU.includes(u);
  const kinds: MeetingKind[] = [];
  if (shared("professionnel")) {
    kinds.push("pro_visio");
    const g = [me.universeData.proGoal, other.universeData.proGoal];
    if (g.includes("mentor_cherche") && g.includes("mentor_offre")) kinds.push("mentorat");
  }
  if (shared("projets")) kinds.push("projet_1h");
  if (shared("voyage")) kinds.push("voyage_visio");
  return kinds;
}

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}/5`}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star className={cn("size-6", n <= value ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

function FeedbackForm({
  meeting,
  other,
  onDone,
}: {
  meeting: MeetingRow;
  other: Profile;
  onDone: () => void;
}) {
  const { t } = useLang();
  const [rating, setRating] = useState(0);
  const [again, setAgain] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [impactSummary, setImpactSummary] = useState("");
  const [impactSaved, setImpactSaved] = useState(false);

  const send = async () => {
    if (!rating) return;
    setBusy(true);
    try {
      await submitMeetingFeedback({ data: { meetingId: meeting.id, rating, again, note } });
      setDone(true);
      onDone();
    } catch {
      /* l'avis a peut-être déjà été donné */
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <div className="mt-2 space-y-2 rounded-xl bg-secondary/60 p-3 text-sm">
        <p>{t("meetingThanks")}</p>
        {meeting.kind === "projet_1h" && !impactSaved && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t("addToImpact")}</p>
            <Input value={impactSummary} maxLength={280} onChange={(e) => setImpactSummary(e.target.value)} placeholder={t("impactSummary")} />
            <Button
              size="sm"
              variant="outline"
              disabled={!impactSummary.trim()}
              onClick={async () => {
                await saveImpactStory({
                  data: { title: `${t("mk_projet_1h")} · ${other.firstName}`, summary: impactSummary, cause: other.universeData.projectCause ?? "" },
                }).catch(() => undefined);
                setImpactSaved(true);
              }}
            >
              {t("impactAdd")}
            </Button>
          </div>
        )}
      </div>
    );

  return (
    <div className="mt-2 space-y-3 rounded-xl bg-secondary/60 p-3">
      <p className="text-sm font-medium">{t("meetingFeedbackTitle")}</p>
      <Stars value={rating} onChange={setRating} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={again} onChange={(e) => setAgain(e.target.checked)} />
        {t("meetingAgain")}
      </label>
      <Textarea rows={2} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("meetingNote")} />
      <Button size="sm" disabled={!rating || busy} onClick={send}>
        {t("meetingSend")}
      </Button>
    </div>
  );
}

function TravelReview({ other }: { other: Profile }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <p className="text-xs text-primary">{t("tripReviewSent")}</p>;
  if (!open)
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t("tripReviewCta")}
      </Button>
    );
  return (
    <div className="space-y-3 rounded-xl bg-secondary/60 p-3">
      <p className="text-sm font-medium">{t("tripReviewTitle")}</p>
      <Stars value={rating} onChange={setRating} />
      <Textarea rows={2} maxLength={400} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("meetingNote")} />
      <Button
        size="sm"
        disabled={!rating}
        onClick={async () => {
          await submitTravelReview({ data: { subjectId: other.userId, rating, body } }).catch(() => undefined);
          setSent(true);
        }}
      >
        {t("meetingSend")}
      </Button>
    </div>
  );
}

/** Rencontres planifiées (visio pro 30 min, mentorat, échange projet d'1 h) + avis de voyage, dans le chat d'un match. */
export function MeetingsPanel({ matchId, me, other }: { matchId: number; me: Profile; other: Profile }) {
  const { t, lang } = useLang();
  const kinds = availableKinds(me, other);
  const showTrip = (me.universes ?? []).includes("voyage") && (other.universes ?? []).includes("voyage");
  const [open, setOpen] = useState(false);
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [kind, setKind] = useState<MeetingKind | "">(kinds[0] ?? "");
  const [when, setWhen] = useState("");
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const list = await listMeetings({ data: { matchId } });
    setMeetings(Array.isArray(list) ? list : []);
  }, [matchId]);
  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  if (!kinds.length && !showTrip) return null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(lang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const propose = async () => {
    if (!kind || !when) return;
    setError(false);
    try {
      await proposeMeeting({ data: { matchId, kind, startsAt: new Date(when).toISOString() } });
      setWhen("");
      await load();
    } catch {
      setError(true);
    }
  };
  const act = async (meetingId: number, action: "accept" | "decline" | "cancel") => {
    await respondMeeting({ data: { meetingId, action } }).catch(() => undefined);
    await load();
  };

  return (
    <div className="border-b border-border bg-card/50 px-4 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-sm font-medium text-primary"
        aria-expanded={open}
      >
        <CalendarClock className="size-4" />
        {t("meetingsTitle")}
      </button>
      {open && (
        <div className="mt-3 space-y-3 pb-2">
          <div className="rounded-2xl border border-border bg-secondary/30 p-3">
            <p className="text-xs font-medium text-primary">{t("dateIdeasTitle")}</p>
            <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
              {[t("dateIdea_1"), t("dateIdea_2"), t("dateIdea_3")].map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </div>
          {kinds.length > 0 && (
            <div className="space-y-2">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as MeetingKind)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {t(`mk_${k}`)}
                  </option>
                ))}
              </select>
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label={t("meetingWhen")} />
              <Button size="sm" disabled={!when || !kind} onClick={propose}>
                {t("meetingPropose")}
              </Button>
              {error && <p className="text-xs text-destructive">{t("meetingError")}</p>}
            </div>
          )}
          {meetings.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-background p-3 text-sm">
              <p className="font-medium">{t(`mk_${m.kind}`)}</p>
              <p className="text-xs text-muted-foreground">
                {fmt(m.startsAt)} · {t(`meeting_${m.status}`)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {m.status === "proposed" && !m.mine && (
                  <>
                    <Button size="sm" onClick={() => act(m.id, "accept")}>
                      {t("meetingAccept")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => act(m.id, "decline")}>
                      {t("meetingDecline")}
                    </Button>
                  </>
                )}
                {m.status === "proposed" && m.mine && <span className="text-xs text-muted-foreground">{t("meetingWaiting")}</span>}
                {(m.status === "proposed" || m.status === "confirmed") && !m.ended && (
                  <Button size="sm" variant="ghost" onClick={() => act(m.id, "cancel")}>
                    {t("meetingCancel")}
                  </Button>
                )}
                {m.joinable && m.room && (
                  <Button size="sm" asChild>
                    <a href={`https://meet.jit.si/${m.room}#config.prejoinPageEnabled=true`} target="_blank" rel="noreferrer">
                      <Video className="mr-1.5 size-4" />
                      {t("meetingJoin")}
                    </a>
                  </Button>
                )}
                {(m.status === "accepted" || m.joinable) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const when = fmt(m.startsAt);
                      const text = t("checkinShareText")
                        .replace("{when}", when)
                        .replace("{name}", other.firstName);
                      try {
                        if (navigator.share) {
                          await navigator.share({ title: "NAYORA", text });
                        } else {
                          await navigator.clipboard.writeText(text);
                          window.alert(t("checkinCopied"));
                        }
                      } catch {
                        try {
                          await navigator.clipboard.writeText(text);
                          window.alert(t("checkinCopied"));
                        } catch {
                          /* ignore */
                        }
                      }
                    }}
                  >
                    {t("checkinCta")}
                  </Button>
                )}
              </div>
              {m.ended && !m.feedbackGiven && <FeedbackForm meeting={m} other={other} onDone={load} />}
            </div>
          ))}
          {showTrip && <TravelReview other={other} />}
        </div>
      )}
    </div>
  );
}
