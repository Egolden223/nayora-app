import { useCallback, useEffect, useState } from "react";
import type { DiscoverCard, MatchRow, Profile } from "@/lib/dating";
import {
  addLike,
  listReceivedLikes,
  passProfile,
} from "@/lib/dating";
import { useLang } from "@/lib/lang";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfilePhoto } from "@/components/profile-photo";
import { NativeBanner } from "@/components/native-banner";
import { ChatRoom } from "@/components/inbox-chat";
export { PremiumPanel } from "@/components/premium-panel";

export function Inbox({
  me,
  matches,
  activeUniverse,
  selectedId,
  onSelect,
  onRefresh,
  onOpenPremium,
}: {
  me: Profile;
  matches: MatchRow[];
  activeUniverse?: string;
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
      activeUniverse={activeUniverse}
      onSelect={onSelect}
      onOpenPremium={onOpenPremium}
      onRefresh={onRefresh}
    />
  );
}

function MatchList({
  me,
  matches,
  activeUniverse,
  onSelect,
  onOpenPremium,
  onRefresh,
}: {
  me: Profile;
  matches: MatchRow[];
  activeUniverse?: string;
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
      setReceived(Array.isArray(list) ? list : []);
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
              <p className="mt-1 text-sm text-primary">
                {t("compatScore")}: {c.score}% · {t(c.matchUniverse)}
              </p>
            )}
          </div>
          {c.bio && (
            <p className="w-full rounded-2xl bg-secondary/50 px-4 py-3 text-sm leading-relaxed">
              {c.bio}
            </p>
          )}
          {(c.reasons ?? []).length > 0 && (
            <ul className="w-full space-y-1 text-sm text-muted-foreground">
              {(c.reasons ?? []).slice(0, 4).map((r) => (
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
                <span className="max-w-20 truncate text-sm">{c.firstName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {matches.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-2xl">{t("noMatches")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeUniverse ? t("noMatchesInUniverse") : t("noMatchesLead")}
          </p>
          {activeUniverse && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("activeUniverse")} : {t(activeUniverse)}
            </p>
          )}
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
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.partner.firstName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {m.lastMessage || t(m.matchUniverse || m.partner.intention)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
