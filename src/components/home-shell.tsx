import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Compass, Crown, PartyPopper, Sparkles, UserRound } from "lucide-react";
import type { DiscoverFilters } from "@/lib/dating";
import type { DiscoverCard, MatchRow, Profile } from "@/lib/dating";
import { getMyProfile, listDiscover, listMatches } from "@/lib/dating";
import { useLang } from "@/lib/lang";
import { Discover } from "@/components/discover";
import { Inbox, PremiumPanel } from "@/components/inbox";
import { MePanel } from "@/components/me-panel";
import { EventsPanel } from "@/components/events-panel";
import { Onboarding } from "@/components/onboarding";
import { Wordmark } from "@/components/wordmark";
import { LanguageSwitch } from "@/components/language-switch";
import { InstallPrompt } from "@/components/install-prompt";
import { cn } from "@/lib/utils";

type Tab = "discover" | "matches" | "events" | "profile" | "premium";

const EMPTY: DiscoverFilters = {
  ageBand: "all",
  gender: "all",
  intention: "all",
  countries: [],
  familyStatus: "all",
  facet: "all",
};

export function HomeShell({
  me,
  onReloadMe,
  editing,
  setEditing,
}: {
  me: Profile;
  onReloadMe: () => Promise<void>;
  editing: boolean;
  setEditing: (v: boolean) => void;
}) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("discover");
  const [filters, setFilters] = useState<DiscoverFilters>(EMPTY);
  const [cards, setCards] = useState<DiscoverCard[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshDiscover = useCallback(async () => {
    const list = await listDiscover({ data: filters });
    setCards(list);
  }, [filters]);

  const refreshMatches = useCallback(async () => {
    const list = await listMatches();
    setMatches(list);
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const [d, m] = await Promise.all([
          listDiscover({ data: filters }),
          listMatches(),
        ]);
        if (!live) return;
        setCards(d);
        setMatches(m);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [filters]);

  if (editing) {
    return (
      <Onboarding
        initial={me}
        onSave={async (data) => {
          const { upsertProfile } = await import("@/lib/dating");
          await upsertProfile({ data });
          await onReloadMe();
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto app-shell px-4 pt-4">
        <InstallPrompt />
      </div>
      {tab === "discover" && (
        <header className="mx-auto flex app-shell items-center justify-between px-4 pb-1 pt-4">
          <Wordmark compact markClassName="text-[1.7rem]" />
          <LanguageSwitch compact />
        </header>
      )}

      <main className="flex-1 pb-20">
        {loading && tab === "discover" ? (
          <div className="mx-auto mt-6 h-[70dvh] app-shell animate-pulse rounded-[28px] bg-card" />
        ) : tab === "discover" ? (
          <Discover
            me={me}
            cards={cards}
            filters={filters}
            onFilters={setFilters}
            onRefresh={() => void refreshDiscover()}
            onMatched={(_p, matchId) => {
              void refreshMatches();
              void refreshDiscover();
              setSelectedMatch(matchId);
            }}
          />
        ) : tab === "matches" ? (
          <Inbox
            me={me}
            matches={matches}
            selectedId={selectedMatch}
            onSelect={setSelectedMatch}
            onRefresh={() => void refreshMatches()}
            onOpenPremium={() => setTab("premium")}
          />
        ) : tab === "premium" ? (
          <PremiumPanel
            me={me}
            onDone={async () => {
              await onReloadMe();
              await refreshMatches();
              setTab("matches");
            }}
          />
        ) : tab === "events" ? (
          <EventsPanel />
        ) : (
          <MePanel
            me={me}
            onEdit={() => setEditing(true)}
            onReload={onReloadMe}
          />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          <NavBtn
            active={tab === "discover"}
            label={t("navDiscover")}
            onClick={() => setTab("discover")}
            icon={<Compass className="size-5" strokeWidth={1.6} />}
          />
          <NavBtn
            active={tab === "matches"}
            label={t("navMatches")}
            onClick={() => {
              setSelectedMatch(null);
              setTab("matches");
              void refreshMatches();
            }}
            icon={<Sparkles className="size-5" strokeWidth={1.6} />}
          />
          <NavBtn
            active={tab === "events"}
            label={t("navEvents")}
            onClick={() => setTab("events")}
            icon={<PartyPopper className="size-5" strokeWidth={1.6} />}
          />
          <NavBtn
            active={tab === "premium"}
            label={t("navPremium")}
            onClick={() => setTab("premium")}
            icon={<Crown className="size-5" strokeWidth={1.6} />}
            accent
          />
          <NavBtn
            active={tab === "profile"}
            label={t("navProfile")}
            onClick={() => setTab("profile")}
            icon={<UserRound className="size-5" strokeWidth={1.6} />}
          />
        </div>
      </nav>
    </div>
  );
}

function NavBtn({
  active,
  label,
  onClick,
  icon,
  accent,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 py-3 text-[10px] font-medium tracking-wide",
        active
          ? accent
            ? "text-accent"
            : "text-primary"
          : accent
            ? "text-accent/70"
            : "text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function useProfileLoader() {
  const [me, setMe] = useState<Profile | null | undefined>(undefined);
  const reload = useCallback(async () => {
    const p = await getMyProfile();
    setMe(p);
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { me, reload };
}
