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
import { formatPriceBreakdown, SCAM_SOFT_PATTERN, trustRules } from "@/lib/constants";
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
