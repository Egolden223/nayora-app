import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Mic, Phone, PhoneOff, Send, ShieldAlert, Square, Video } from "lucide-react";
import type { CallState, ChatMessage, MatchRow, Profile } from "@/lib/dating";
import {
  getCallState,
  listMessages,
  reportProfile,
  requestCall,
  requestContact,
  respondCall,
  respondContact,
  sendMessage,
  sendVoiceMessage,
  sendImageMessage,
  shareMyPhone,
} from "@/lib/dating";
import { useLang } from "@/lib/lang";
import { SCAM_SOFT_PATTERN, trustRules } from "@/lib/constants";
import { VoiceRecorder } from "@/lib/voice-record";
import { fileToResizedDataUrl } from "@/lib/image-resize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfilePhoto } from "@/components/profile-photo";
import { MeetingsPanel } from "@/components/meetings-panel";
import { cn } from "@/lib/utils";

export function ChatRoom({
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
                    : "rounded-bl-md bg-secondary text-secondary-foreground",
                )}
              >
                {m.kind === "image" && m.imageUrl ? (
                  <img src={m.imageUrl} alt="" className="max-h-48 rounded-xl" />
                ) : m.kind === "voice" && m.audioUrl ? (
                  <audio controls src={m.audioUrl} className="max-w-full" />
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-border px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void sendPhoto(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={sendingVoice || recording}
          onClick={() => photoInput.current?.click()}
          aria-label={t("sendPhoto")}
        >
          <ImageIcon className="size-4" />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("messagePlaceholder")}
          className="flex-1"
          disabled={recording}
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
            disabled={sendingVoice}
            onClick={() => {
              if (recording) void stopRecording();
              else void startRecording();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (recording) cancelRecording();
            }}
            aria-label={recording ? t("stopRecording") : t("recordVoice")}
          >
            {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
          </Button>
        )}
      </form>
    </div>
  );
}
