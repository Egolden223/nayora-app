import { useEffect, useRef, useState } from "react";
import {
  Heart,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  AGE_BANDS,
  COUNTRY_CODES,
  FAMILY_STATUSES,
  GENDERS,
  INTENTIONS,
} from "@/lib/constants";
import type { CuratedSuggestion, DiscoverCard, DiscoverFilters, Profile } from "@/lib/dating";
import {
  addLike,
  dismissSuggestion,
  explainMatch,
  listMySuggestions,
  passProfile,
  suggestIcebreaker,
} from "@/lib/dating";
import { countryName, sortedCountryCodes } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldSelect } from "@/components/field-select";
import { ProfilePhoto } from "@/components/profile-photo";
import { UniverseBar } from "@/components/universe";
import { UniverseFacts } from "@/components/universe-form";
import { UNIVERSE_FACETS } from "@/lib/universe-match";

const emptyFiltersFor = (intention: string): DiscoverFilters => ({
  ageBand: "all",
  gender: "all",
  intention,
  countries: [],
  familyStatus: "all",
  facet: "all",
});

export function Discover({
  me,
  cards,
  filters,
  onFilters,
  onRefresh,
  onMatched,
}: {
  me: Profile;
  cards: DiscoverCard[];
  filters: DiscoverFilters;
  onFilters: (f: DiscoverFilters) => void;
  onRefresh: () => void;
  onMatched: (partner: DiscoverCard, matchId: number) => void;
}) {
  const { t, lang } = useLang();
  const myUniverses = me.universes?.length ? me.universes : [me.intention || "mariage"];
  const [index, setIndex] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [spark, setSpark] = useState<DiscoverCard | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [ice, setIce] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setIndex(0);
    setInsight(null);
    setIce(null);
  }, [cards]);

  const current = cards[index];

  // Temporary stub while full file is restored via upload if needed
  if (!current) {
    return (
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-sm flex-col items-center justify-center px-6 text-center">
        <UniverseBar
          className="mb-4 w-full"
          allowed={myUniverses}
          value={filters.intention}
          onChange={(v) => onFilters({ ...filters, intention: v, facet: "all", gender: "all", ageBand: "all", familyStatus: "all" })}
        />
        <h2 className="font-display text-3xl font-medium">{t("endOfDeck")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("endOfDeckLead")}</p>
        <Button className="mt-6" variant="outline" onClick={() => { onFilters(emptyFiltersFor(filters.intention || myUniverses[0])); onRefresh(); }}>
          {t("widen")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto app-shell px-4 pb-4">
      <UniverseBar
        className="mb-3"
        allowed={myUniverses}
        value={filters.intention}
        onChange={(v) => onFilters({ ...filters, intention: v, facet: "all", gender: "all", ageBand: "all", familyStatus: "all" })}
      />
      <p className="text-sm text-muted-foreground mb-4">Chargement du module discover… Rechargez après restauration complète.</p>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[28px] border border-border bg-card">
        <ProfilePhoto name={current.firstName} seed={current.userId} photoUrl={current.photoUrl} hidden={current.photoHidden} className="absolute inset-0 h-full w-full" textClassName="text-8xl" />
      </div>
    </div>
  );
}
