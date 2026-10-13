import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Lock, Mic, Phone, PhoneOff, Send, ShieldAlert, Square, Video } from "lucide-react";
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
  sendImageMessage,
  shareMyPhone,
  subscribePremium,
} from "@/lib/dating";
import { useLang } from "@/lib/lang";
import { formatPrice, SCAM_SOFT_PATTERN, trustRules } from "@/lib/constants";
import { VoiceRecorder } from "@/lib/voice-record";
import { fileToResizedDataUrl } from "@/lib/image-resize";
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
      <div className="page-panel flex h-full flex-col px-4 pb-6">
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
        </div>
        <div className="mt-auto flex w-full gap-3">
          <Button className="flex-1" variant="outline" disabled={busy} onClick={() => void handleDecline(c)}>
            {t("pass")}
          </Button>
          <Button className="flex-1" disabled={busy} onClick={() => void handleAccept(c)}>
            {t("like")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-panel flex h-full flex-col">
      <div className="flex items-center justify-between py-3">
        <h1 className="font-display text-3xl font-medium">{t("navMatches")}</h1>
      </div>
      <NativeBanner premium={me.isPremium} onCta={onOpenPremium} />
      {received.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("interestReceived")}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {received.map((c) => (
              <button
                key={c.userId}
                type="button"
                onClick={() => setSelectedLike(c)}
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <ProfilePhoto
                  name={c.firstName}
                  seed={c.userId}
                  photoUrl={c.photoUrl}
                  className="size-16 rounded-full ring-2 ring-primary"
                  textClassName="text-lg"
                />
                <span className="max-w-16 truncate text-xs">{c.firstName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {matches.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-2xl">{t("noMatches")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("noMatchesLead")}</p>
        </div>
      ) : (
        <div className="flex-1 space-y-1 overflow-y-auto pb-4">
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-secondary"
            >
              <div className="relative">
                <ProfilePhoto
                  name={m.partner.firstName}
                  seed={m.partner.userId}
                  photoUrl={m.partner.photoUrl}
                  className="size-12 rounded-full"
                  textClassName="text-sm"
                />
                {m.unread > 0 && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {m.unread > 9 ? "9+" : m.unread}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.partner.firstName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.lastMessage || t(m.partner.intention)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
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
    media: "video",
  });
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const recordTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [sendingVoice, setSendingVoice] = useState(false);
  const recorder = useRef<VoiceRecorder | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const list = await listMessages({ data: { matchId: match.id } });
    setMessages(list);
  }, [match.id]);

  const loadCall = useCallback(async () => {
    setCallState(await getCallState({ data: { matchId: match.id } }));
  }, [match.id]);

  useEffect(() => {
    void load();
    void loadCall();
    const id = setInterval(() => {
      void load();
      void loadCall();
    }, 4000);
    return () => clearInterval(id);
  }, [load, loadCall]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const body = input.trim();
    if (!body) return;
    if (SCAM_SOFT_PATTERN.test(body)) {
      if (!window.confirm(t("scamWarn"))) return;
    }
    setInput("");
    await sendMessage({ data: { matchId: match.id, body } });
    await load();
    onRefresh();
  };

  const startRecording = async () => {
    try {
      recorder.current = new VoiceRecorder();
      await recorder.current.start();
      setRecording(true);
      setRecordSecs(0);
      if (recordTimer.current) clearInterval(recordTimer.current);
      recordTimer.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch {
      recorder.current = null;
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recorder.current) return;
    if (recordTimer.current) {
      clearInterval(recordTimer.current);
      recordTimer.current = null;
    }
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
      setRecordSecs(0);
    }
  };

  const cancelRecording = () => {
    if (recordTimer.current) {
      clearInterval(recordTimer.current);
      recordTimer.current = null;
    }
    recorder.current?.cancel();
    recorder.current = null;
    setRecording(false);
    setRecordSecs(0);
  };

  const sendPhoto = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setSendingVoice(true);
    try {
      const imageUrl = await fileToResizedDataUrl(file, { maxSize: 1280, quality: 0.82 });
      await sendImageMessage({ data: { matchId: match.id, imageUrl } });
      await load();
      onRefresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("authError"));
    } finally {
      setSendingVoice(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  };

  const incomingCall = callState.status === "pending" && !callState.mine;

  return (
    <div className="mx-auto flex h-[calc(100dvh-5.5rem)] w-full max-w-lg flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button type="button" onClick={onBack} className="text-sm text-muted-foreground">
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
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("requestCallAudio")}
              title={t("requestCallAudio")}
              onClick={async () => {
                await requestCall({ data: { matchId: match.id, media: "audio" } });
                await loadCall();
              }}
            >
              <Phone className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("requestCallVideo")}
              title={t("requestCallVideo")}
              onClick={async () => {
                await requestCall({ data: { matchId: match.id, media: "video" } });
                await loadCall();
              }}
            >
              <Video className="size-4" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("safety")}
          onClick={async () => {
            if (!window.confirm(t("blockConfirm"))) return;
            await reportProfile({
              data: { userId: match.partner.userId, reason: "blocage_chat" },
            });
            onBack();
            onRefresh();
          }}
        >
          <ShieldAlert className="size-4" />
        </Button>
      </header>

      {callState.room && (
        <div className="call-overlay">
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 text-cream">
            <p className="text-sm font-medium">
              {callState.media === "audio" ? t("callAudioTitle") : t("callVideoTitle")}
              {" · "}
              {match.partner.firstName}
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await respondCall({ data: { matchId: match.id, accept: false } });
                await loadCall();
              }}
            >
              <PhoneOff className="size-4" />
              {t("endCall")}
            </Button>
          </div>
          <iframe
            title={callState.media === "audio" ? t("callAudioTitle") : t("callVideoTitle")}
            src={
              callState.media === "audio"
                ? `https://meet.jit.si/${callState.room}#config.startWithVideoMuted=true&config.prejoinPageEnabled=false&config.startWithAudioMuted=false`
                : `https://meet.jit.si/${callState.room}#config.prejoinPageEnabled=true`
            }
            allow="camera; microphone; fullscreen; display-capture; autoplay"
          />
        </div>
      )}

      {match.contactStatus === "pending" && !match.contactMine && (
        <div className="flex items-center justify-center gap-2 border-b border-border px-4 py-2">
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
              await respondContact({ data: { matchId: match.id, accept: false } });
              onRefresh();
            }}
          >
            {t("contactDecline")}
          </Button>
        </div>
      )}

      {callState.status === "pending" && callState.mine && (
        <p className="border-b border-border px-4 py-2 text-center text-sm text-muted-foreground">
          {t("callSent")}
        </p>
      )}
      {incomingCall && (
        <div className="flex flex-col items-center gap-2 border-b border-border bg-primary/10 px-4 py-3">
          <p className="text-sm font-medium">
            {match.partner.firstName}{" "}
            {callState.media === "audio" ? t("callIncomingAudio") : t("callIncomingVideo")}
          </p>
          <div className="flex gap-2">
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
        </div>
      )}

      <MeetingsPanel matchId={match.id} partnerName={match.partner.firstName} />

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("emptyChat")}</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === me.userId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-secondary text-foreground",
                )}
              >
                {m.kind === "voice" && m.audioUrl ? (
                  <div className="space-y-1">
                    <audio controls src={m.audioUrl} className="h-9 max-w-[220px]" />
                  </div>
                ) : m.kind === "image" && m.audioUrl ? (
                  <button
                    type="button"
                    className="block overflow-hidden rounded-xl"
                    onClick={() => window.open(m.audioUrl!, "_blank")}
                  >
                    <img src={m.audioUrl} alt="" className="chat-bubble-img" />
                  </button>
                ) : (
                  m.body
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void sendPhoto(e.target.files?.[0])}
      />
      {recording && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-destructive/10 px-4 py-2 text-sm">
          <span className="font-medium text-destructive">
            ● {t("recording")} {Math.floor(recordSecs / 60)}:{String(recordSecs % 60).padStart(2, "0")}
          </span>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={cancelRecording}>
              {t("cancel")}
            </Button>
            <Button type="button" size="sm" onClick={() => void stopRecording()}>
              {t("send")}
            </Button>
          </div>
        </div>
      )}
      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={t("sendPhoto")}
          disabled={recording || sendingVoice}
          onClick={() => photoInput.current?.click()}
        >
          <ImageIcon className="size-5" />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("messagePh")}
          disabled={recording || sendingVoice}
          className="flex-1"
        />
        {input.trim() ? (
          <Button type="submit" size="icon" aria-label={t("send")} disabled={sendingVoice}>
            <Send className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant={recording ? "destructive" : "outline"}
            aria-label={t("recordVoice")}
            disabled={sendingVoice}
            onClick={() => {
              if (recording) void stopRecording();
              else void startRecording();
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
    <div className="page-panel page-panel-top text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">Prestige</p>
      <h1 className="mt-2 font-display text-4xl font-medium">{t("premiumTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("premiumLead")}</p>
      <ul className="mt-8 space-y-3 text-left text-sm">
        {[t("premiumChat"), t("premiumBoost"), t("premiumBadge"), t("premiumAds")].map((line) => (
          <li key={line} className="rounded-2xl border border-border bg-card px-4 py-3">
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-8 font-display text-4xl tabular-nums">
        {price}
        <span className="ml-2 font-sans text-sm text-muted-foreground">{t("perYear")}</span>
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
      <p className="mt-3 text-xs text-muted-foreground">{t("premiumLaunchNote")}</p>
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
