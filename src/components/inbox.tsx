import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, Mic, Phone, PhoneOff, Send, ShieldAlert, Square, Video } from "lucide-react";
import type { CallState, ChatMessage, DiscoverCard, MatchRow, Profile } from "@/lib/dating";
import {
  addLike,
  getCallState,
  grantBonusChat,
  listMessages,
  listReceivedLikes,
  passProfile,
  reportProfile,
  requestCall,
  requestContact,
  respondCall,
  respondContact,
  sendMessage,
  sendVoiceMessage,
  shareMyPhone,
  subscribePremium,
} from "@/lib/dating";
import { useLang } from "@/lib/lang";
import { formatPrice, SCAM_SOFT_PATTERN, trustRules } from "@/lib/constants";
import { VoiceRecorder } from "@/lib/voice-record";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfilePhoto } from "@/components/profile-photo";
import { NativeBanner } from "@/components/native-banner";
import { MeetingsPanel } from "@/components/meetings-panel";
import { MatchmakerSection } from "@/components/matchmaker-panel";
import { cn } from "@/lib/utils";

export function Inbox({
  me,
  matches,
  selectedId,
  onSelect,
  onRefresh,
  onOpenPremium,
}: {
  me: Profile;
  matches: MatchRow[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onRefresh: () => void;
  onOpenPremium: () => void;
}) {
  const selected = matches.find((m) => m.id === selectedId) ?? null;
  if (selected) {
    return (
      <ChatRoom
        me={me}
        match={selected}
        onBack={() => onSelect(null)}
        onRefresh={onRefresh}
        onOpenPremium={onOpenPremium}
      />
    );
  }
  return (
    <MatchList
      me={me}
      matches={matches}
      onSelect={onSelect}
      onOpenPremium={onOpenPremium}
      onRefresh={onRefresh}
    />
  );
}

function MatchList({
  me,
  matches,
  onSelect,
  onOpenPremium,
  onRefresh,
}: {
  me: Profile;
  matches: MatchRow[];
  onSelect: (id: number) => void;
  onOpenPremium: () => void;
  onRefresh?: () => void;
}) {
  const { t } = useLang();
  const [received, setReceived] = useState<DiscoverCard[]>([]);
  const [selectedLike, setSelectedLike] = useState<DiscoverCard | null>(null);
  const [busy, setBusy] = useState(false);

  const loadReceived = useCallback(async () => {
    try {
      const list = await listReceivedLikes();
      setReceived(list);
    } catch {
      setReceived([]);
    }
  }, []);

  useEffect(() => {
    void loadReceived();
  }, [loadReceived]);

  const handleAccept = async (card: DiscoverCard) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await addLike({ data: { userId: card.userId } });
      if (res.status === "rate_limited") {
        window.alert(t("likeLimitReached"));
        return;
      }
      setSelectedLike(null);
      await loadReceived();
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async (card: DiscoverCard) => {
    if (busy) return;
    setBusy(true);
    try {
      await passProfile({ data: { userId: card.userId } });
      setSelectedLike(null);
      await loadReceived();
    } finally {
      setBusy(false);
    }
  };

  if (selectedLike) {
    const c = selectedLike;
    return (
      <div className="mx-auto flex h-full w-full max-w-lg flex-col px-4 pb-6">
        <div className="flex items-center gap-3 py-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedLike(null)}>
            ←
          </Button>
          <h1 className="font-display text-2xl font-medium">{t("interestReceived")}</h1>
        </div>
        <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto">
          <ProfilePhoto
            name={c.firstName}
            seed={c.userId}
            photoUrl={c.photoUrl}
            className="size-36 rounded-full"
            textClassName="text-4xl"
          />
          <div className="text-center">
            <p className="font-display text-2xl font-medium">{c.firstName}</p>
            <p className="text-sm text-muted-foreground">
              {t(c.intention)} · {c.city}
              {c.country ? `, ${c.country}` : ""}
            </p>
            {c.score > 0 && (
              <p className="mt-1 text-xs text-primary">
                {t("compatScore")}: {c.score}% · {t(c.matchUniverse)}
              </p>
            )}
          </div>
          {c.bio && (
            <p className="w-full rounded-2xl bg-secondary/50 px-4 py-3 text-sm leading-relaxed">
              {c.bio}
            </p>
          )}
          {c.reasons.length > 0 && (
            <ul className="w-full space-y-1 text-sm text-muted-foreground">
              {c.reasons.slice(0, 4).map((r) => (
                <li key={r}>· {t(r)}</li>
              ))}
            </ul>
          )}
          <p className="text-center text-xs text-muted-foreground">
            {t("interestDecideLead")}
          </p>
          <div className="mt-auto flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => void handleDecline(c)}
            >
              {t("interestDecline")}
            </Button>
            <Button
              className="flex-1"
              disabled={busy}
              onClick={() => void handleAccept(c)}
            >
              {t("interestAccept")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col px-4">
      <div className="flex items-center justify-between py-3">
        <h1 className="font-display text-3xl font-medium">{t("navMatches")}</h1>
        <Badge tone={me.isPremium ? "primary" : "muted"}>
          {me.isPremium ? t("prestige") : t("standard")}
        </Badge>
      </div>
      <NativeBanner premium={me.isPremium} onCta={onOpenPremium} />

      {received.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            {t("interestReceived")} ({received.length})
          </p>
          <ul className="space-y-1">
            {received.map((c) => (
              <li key={c.userId}>
                <button
                  type="button"
                  onClick={() => setSelectedLike(c)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-2 py-2.5 text-left hover:bg-primary/10"
                >
                  <ProfilePhoto
                    name={c.firstName}
                    seed={c.userId}
                    photoUrl={c.photoUrl}
                    className="size-14 rounded-full"
                    textClassName="text-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.firstName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t(c.intention)} · {c.city}
                      {c.score > 0 ? ` · ${c.score}%` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-primary">
                    {t("interestView")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {matches.length === 0 && received.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h2 className="font-display text-2xl">{t("noMatches")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("noMatchesLead")}</p>
        </div>
      ) : matches.length > 0 ? (
        <ul className="flex-1 space-y-1 overflow-y-auto pb-4">
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => (m.locked ? onOpenPremium() : onSelect(m.id))}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-secondary"
              >
                <div className="relative">
                  <ProfilePhoto
                    name={m.partner.firstName}
                    seed={m.partner.userId}
                    photoUrl={m.partner.photoUrl}
                    className="size-14 rounded-full"
                    textClassName="text-lg"
                  />
                  {m.locked && (
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-card text-muted-foreground">
                      <Lock className="size-3" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.partner.firstName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.locked
                      ? t("chatLocked")
                      : m.lastMessage || t("startChat")}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ChatRoom({
  me,
  match,
  onBack,
  onRefresh,
  onOpenPremium,
}: {
  me: Profile;
  match: MatchRow;
  onBack: () => void;
  onRefresh: () => void;
  onOpenPremium: () => void;
}) {
  const { t } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [callState, setCallState] = useState<CallState>({
    status: "none",
    mine: false,
    room: null,
  });
  const [recording, setRecording] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const recorder = useRef<VoiceRecorder | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const rows = await listMessages({ data: { matchId: match.id } });
    setMessages(rows);
  }, [match.id]);

  const loadCall = useCallback(async () => {
    setCallState(await getCallState({ data: { matchId: match.id } }));
  }, [match.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadCall();
    // Pas de websocket dans cette app : un court polling suffit pour que la
    // proposition d'appel de l'autre personne apparaisse sans recharger.
    const id = setInterval(() => void loadCall(), 4000);
    return () => clearInterval(id);
  }, [loadCall]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (match.locked) {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <Lock className="mb-4 size-8 text-muted-foreground" />
        <h2 className="font-display text-3xl">{t("chatLocked")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("chatLockedLead")}</p>
        <Button className="mt-6" onClick={onOpenPremium}>
          {t("goPremium")}
        </Button>
        <Button variant="ghost" className="mt-2" onClick={onBack}>
          {t("keepBrowsing")}
        </Button>
      </div>
    );
  }

  const send = async () => {
    const body = input.trim();
    if (!body) return;
    // Termes ambigus (crypto, « besoin d'argent »…) : simple rappel de prudence, jamais un blocage.
    if (SCAM_SOFT_PATTERN.test(body) && !window.confirm(t("scamWarning"))) return;
    setInput("");
    try {
      await sendMessage({ data: { matchId: match.id, body } });
      await load();
      onRefresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("authError");
      window.alert(msg);
      setInput(body);
    }
  };

  const matchAgeHours =
    (Date.now() - new Date(match.createdAt).getTime()) / (60 * 60 * 1000);
  // 72 h si les deux sont dans Love, 24 h sinon (même règle que le serveur).
  const trust = trustRules(me.universes, match.partner.universes);
  const phoneShareReady = matchAgeHours >= trust.hours;
  const phoneShareHoursLeft = Math.max(0, Math.ceil(trust.hours - matchAgeHours));

  const sendPhone = async () => {
    if (!phoneShareReady) {
      window.alert(t("phoneShareTooEarly").replace("{hours}", String(phoneShareHoursLeft)));
      return;
    }
    if (!me.phone?.trim()) {
      window.alert(t("phoneShareMissing"));
      return;
    }
    if (!window.confirm(t("phoneShareWarn1"))) return;
    if (!window.confirm(t("phoneShareWarn2"))) return;
    try {
      await shareMyPhone({ data: { matchId: match.id, confirmed: true } });
      await load();
      onRefresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("authError"));
    }
  };

  const blockAndReport = async () => {
    if (!window.confirm(t("blockConfirm"))) return;
    await reportProfile({
      data: { userId: match.partner.userId, reason: "blocage_chat" },
    });
    onBack();
    onRefresh();
  };

  const startRecording = async () => {
    try {
      recorder.current = new VoiceRecorder();
      await recorder.current.start();
      setRecording(true);
    } catch {
      recorder.current = null;
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recorder.current) return;
    setRecording(false);
    setSendingVoice(true);
    try {
      const audioUrl = await recorder.current.stop();
      await sendVoiceMessage({ data: { matchId: match.id, audioUrl } });
      await load();
      onRefresh();
    } finally {
      recorder.current = null;
      setSendingVoice(false);
    }
  };

  const cancelRecording = () => {
    recorder.current?.cancel();
    recorder.current = null;
    setRecording(false);
  };

  const incomingPending =
    match.contactStatus === "pending" && !match.contactMine;
  const incomingCall = callState.status === "pending" && !callState.mine;

  return (
    <div className="mx-auto flex h-[calc(100dvh-5.5rem)] w-full max-w-lg flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground"
        >
          ←
        </button>
        <ProfilePhoto
          name={match.partner.firstName}
          seed={match.partner.userId}
          photoUrl={match.partner.photoUrl}
          className="size-10 rounded-full"
          textClassName="text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{match.partner.firstName}</p>
          <p className="text-[11px] text-muted-foreground">
            {t(match.partner.intention)} · {match.partner.city}
          </p>
        </div>
        {match.contactStatus === "none" && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await requestContact({ data: { matchId: match.id } });
              onRefresh();
            }}
          >
            <Phone className="size-3.5" />
            {t("requestContact")}
          </Button>
        )}
        {callState.status === "none" && (
          <Button
            variant="outline"
            size="icon"
            aria-label={t("requestCall")}
            onClick={async () => {
              await requestCall({ data: { matchId: match.id } });
              await loadCall();
            }}
          >
            <Video className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("safety")}
          onClick={() => setSafetyOpen((v) => !v)}
        >
          <ShieldAlert className="size-4" />
        </Button>
      </header>

      <MeetingsPanel matchId={match.id} me={me} other={match.partner} />

      {safetyOpen && (
        <div className="border-b border-border bg-card px-4 py-3 text-sm">
          <p className="font-medium">{t("safetyShareTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("safetyShareLead")}</p>
          {me.emergencyName && me.emergencyPhone ? (
            <>
              <p className="mt-2 text-xs text-muted-foreground">{t("safetyMessage")}</p>
              <div className="mt-1 rounded-xl bg-secondary p-3 text-xs leading-relaxed">
                {`Je vois ${match.partner.firstName} (NAYORA) — je préviens ${me.emergencyName} au cas où. Contact : ${me.emergencyPhone}.`}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  const msg = `Je vois ${match.partner.firstName} (NAYORA) — je préviens ${me.emergencyName} au cas où. Contact : ${me.emergencyPhone}.`;
                  navigator.clipboard?.writeText(msg);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? t("copied") : t("copy")}
              </Button>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">{t("safetyNoContact")}</p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {t("securityNoticeChat")}
          </p>
          {!phoneShareReady && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t("phoneShareTooEarly").replace("{hours}", String(phoneShareHoursLeft))}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!phoneShareReady}
              onClick={() => void sendPhone()}
            >
              {t("phoneShareBtn")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void blockAndReport()}>
              {t("blockReport")}
            </Button>
          </div>
        </div>
      )}

      {callState.room && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <iframe
            title="Appel vidéo"
            src={`https://meet.jit.si/${callState.room}#config.prejoinPageEnabled=true`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="flex-1 border-0"
          />
          <Button
            variant="destructive"
            className="m-3"
            onClick={async () => {
              await respondCall({ data: { matchId: match.id, accept: false } });
              await loadCall();
            }}
          >
            <PhoneOff className="size-4" />
            {t("endCall")}
          </Button>
        </div>
      )}

      {match.contactStatus === "pending" && match.contactMine && (
        <p className="px-4 py-2 text-center text-xs text-muted-foreground">
          {t("contactSent")}
        </p>
      )}
      {incomingPending && (
        <div className="flex items-center justify-center gap-2 px-4 py-2">
          <Button
            size="sm"
            onClick={async () => {
              await respondContact({ data: { matchId: match.id, accept: true } });
              onRefresh();
            }}
          >
            {t("contactAccept")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await respondContact({
                data: { matchId: match.id, accept: false },
              });
              onRefresh();
            }}
          >
            {t("contactDecline")}
          </Button>
        </div>
      )}
      {match.contactStatus === "accepted" && match.revealedPhone && (
        <p className="px-4 py-2 text-center text-xs">
          {t("contactRevealed")}: {match.revealedPhone}
        </p>
      )}

      {callState.status === "pending" && callState.mine && (
        <p className="px-4 py-2 text-center text-xs text-muted-foreground">
          {t("callSent")}
        </p>
      )}
      {incomingCall && (
        <div className="flex items-center justify-center gap-2 px-4 py-2">
          <p className="text-xs text-muted-foreground">
            {match.partner.firstName} {t("callIncoming")}
          </p>
          <Button
            size="sm"
            onClick={async () => {
              await respondCall({ data: { matchId: match.id, accept: true } });
              await loadCall();
            }}
          >
            {t("callAccept")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await respondCall({ data: { matchId: match.id, accept: false } });
              await loadCall();
            }}
          >
            {t("callDecline")}
          </Button>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t("emptyChat")}
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === me.userId;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-secondary text-foreground",
                )}
              >
                {m.kind === "voice" && m.audioUrl ? (
                  <audio controls src={m.audioUrl} className="h-9 max-w-[220px]" />
                ) : (
                  m.body
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form
        className="flex gap-2 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={recording ? t("recording") : t("messagePh")}
          disabled={recording || sendingVoice}
        />
        {input.trim() ? (
          <Button type="submit" size="icon" aria-label={t("send")}>
            <Send className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant={recording ? "destructive" : "outline"}
            aria-label={t("recordVoice")}
            disabled={sendingVoice}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={() => recording && cancelRecording()}
            onTouchStart={(e) => {
              e.preventDefault();
              void startRecording();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              void stopRecording();
            }}
          >
            {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
          </Button>
        )}
      </form>
    </div>
  );
}

export function PremiumPanel({
  me,
  onDone,
}: {
  me: Profile;
  onDone: () => void;
}) {
  const { t } = useLang();
  const price = formatPrice(me.country);
  const [watching, setWatching] = useState(false);
  const [activating, setActivating] = useState(false);
  const [method, setMethod] = useState<"orange" | "paypal">("orange");

  return (
    <div className="mx-auto flex min-h-[80dvh] w-full max-w-sm flex-col justify-center px-5 py-8 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
        Prestige
      </p>
      <h1 className="mt-2 font-display text-4xl font-medium">
        {t("premiumTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("premiumLead")}</p>
      <ul className="mt-8 space-y-3 text-left text-sm">
        {[t("premiumChat"), t("premiumBoost"), t("premiumBadge"), t("premiumAds")].map(
          (line) => (
            <li
              key={line}
              className="rounded-2xl border border-border bg-card px-4 py-3"
            >
              {line}
            </li>
          ),
        )}
      </ul>
      <p className="mt-8 font-display text-4xl tabular-nums">
        {price}
        <span className="ml-2 font-sans text-sm text-muted-foreground">
          {t("perYear")}
        </span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{t("transparentPricing")}</p>
      {!me.isPremium && (
        <div className="mt-6 text-left">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {t("paymentMethod")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("orange")}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                method === "orange"
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {t("payOrange")}
            </button>
            <button
              type="button"
              onClick={() => setMethod("paypal")}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                method === "paypal"
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {t("payPaypal")}
            </button>
          </div>
        </div>
      )}
      {/* Lancement gratuit : activation ouverte pendant la phase early-adopter,
          quel que soit le moyen de paiement choisi ci-dessus (aucun des deux
          n'est encore branché à un vrai fournisseur — voir README). */}
      <p className="mt-3 text-xs text-muted-foreground">
        {t("premiumLaunchNote")}
      </p>
      {me.isPremium ? (
        <p className="mt-6 text-sm text-primary">{t("subscribed")}</p>
      ) : (
        <Button
          className="mt-6 w-full"
          disabled={activating}
          onClick={async () => {
            setActivating(true);
            try {
              await subscribePremium();
              onDone();
            } finally {
              setActivating(false);
            }
          }}
        >
          {activating ? t("loading") : t("subscribeLaunch")}
        </Button>
      )}
      {!me.isPremium && (
        <Button
          variant="ghost"
          className="mt-3"
          disabled={watching}
          onClick={async () => {
            setWatching(true);
            await new Promise((r) => setTimeout(r, 1600));
            await grantBonusChat();
            setWatching(false);
            onDone();
          }}
        >
          {watching ? t("loading") : t("watchAd")}
        </Button>
      )}
      <MatchmakerSection isPremium={me.isPremium} />
    </div>
  );
}
