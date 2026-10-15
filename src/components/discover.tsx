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
import { FilterSheet } from "@/components/filter-sheet";
import { UniverseFacts } from "@/components/universe-form";
import { UNIVERSE_FACETS } from "@/lib/universe-match";

const emptyFiltersFor = (intention: string): DiscoverFilters => ({
  ageBand: "all",
  gender: "all",
  intention,
  countries: [],
  familyStatus: "all",
  facet: "all",
  ageMin: undefined,
  ageMax: undefined,
  heightMin: undefined,
  religion: "all",
  city: "",
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
  const [likedOn, setLikedOn] = useState<"profile" | "photo" | "bio" | "reason">("profile");
  const [likeNote, setLikeNote] = useState("");

  useEffect(() => {
    setIndex(0);
    setInsight(null);
    setIce(null);
    setLikedOn("profile");
    setLikeNote("");
  }, [cards]);

  const current = cards[index];

  const pass = async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      await passProfile({ data: { userId: current.userId } });
      setIndex((i) => i + 1);
      setInsight(null);
      setIce(null);
    } finally {
      setBusy(false);
    }
  };

  const like = async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      const res = await addLike({
        data: {
          userId: current.userId,
          likedOn,
          note: likeNote.trim().slice(0, 200) || undefined,
        },
      });
      if (res.status === "rate_limited") {
        setNotice(t("likeLimitReached"));
        return;
      }
      setNotice(null);
      if (res.status === "matched") {
        if (likeNote.trim() && typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(
            `nayora:likeNote:${res.matchId}`,
            likeNote.trim().slice(0, 200),
          );
        }
        setSpark(current);
        onMatched(current, res.matchId);
      }
      setIndex((i) => i + 1);
      setInsight(null);
      setIce(null);
      setLikedOn("profile");
      setLikeNote("");
    } finally {
      setBusy(false);
    }
  };

  const askWhy = async () => {
    if (!current) return;
    const res = await explainMatch({
      data: { userId: current.userId, lang },
    });
    if (res.ok) setInsight(res.text);
  };

  const askIce = async () => {
    if (!current) return;
    const res = await suggestIcebreaker({
      data: { userId: current.userId, lang },
    });
    if (res.ok) setIce(res.text);
  };

  if (!current) {
    return (
      <div className="mx-auto app-main px-4">
        <UniverseBar
          className="mb-3 w-full"
          allowed={myUniverses}
          value={filters.intention}
          onChange={(v) => onFilters({ ...filters, intention: v, facet: "all", gender: "all", ageBand: "all", familyStatus: "all" })}
        />
        <div className="mb-3 flex w-full justify-end">
          <IconBtn
            label={t("filters")}
            onClick={() => {
              setDraft(filters);
              setFiltersOpen(true);
            }}
          >
            <SlidersHorizontal className="size-5" />
          </IconBtn>
        </div>
        <div className="discover-empty">
          <div className="mb-4 grid size-16 place-items-center rounded-full border border-border bg-card text-primary">
            <Sparkles className="size-7" />
          </div>
          <h2 className="font-display text-2xl font-medium sm:text-3xl">{t("endOfDeck")}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("endOfDeckLead")}</p>
          <Button
            className="mt-6 min-h-[2.75rem]"
            variant="outline"
            onClick={() => {
              onFilters(emptyFiltersFor(filters.intention || myUniverses[0]));
              onRefresh();
            }}
          >
            {t("widen")}
          </Button>
        </div>
        {filtersOpen && (
          <FilterSheet
            draft={draft}
            setDraft={setDraft}
            universe={filters.intention}
            onClose={() => setFiltersOpen(false)}
            onApply={() => {
              onFilters(draft);
              setFiltersOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto app-main px-4 pb-4">
      <UniverseBar
        className="mb-3"
        allowed={myUniverses}
        value={filters.intention}
        onChange={(v) => onFilters({ ...filters, intention: v, facet: "all", gender: "all", ageBand: "all", familyStatus: "all" })}
      />
      <FindMeBox filters={filters} onFilters={onFilters} />
      {notice && <p className="mb-3 rounded-xl bg-secondary px-3 py-2 text-sm text-primary">{notice}</p>}
      <CuratedSuggestions />
      {index < 5 && cards.length > 0 && (
        <div className="mb-3 rounded-2xl border border-primary/30 bg-primary/5 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            {t("dailyTopTitle")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t("dailyTopLead")}</p>
        </div>
      )}
      {index >= 5 && (
        <div className="mb-3 rounded-2xl border border-border bg-secondary/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">{t("exploreMoreTitle")}</p>
        </div>
      )}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {index < 5
            ? `${t("dailyCard")} ${Math.min(index + 1, 5)} / ${Math.min(5, cards.length)}`
            : `${index + 1} / ${cards.length}`}
        </p>
        <IconBtn
          label={t("filters")}
          onClick={() => {
            setDraft(filters);
            setFiltersOpen(true);
          }}
        >
          <SlidersHorizontal className="size-5" />
        </IconBtn>
      </div>

      <SwipeCard onLike={like} onPass={pass}>
        <div className="discover-card-frame">
          <ProfilePhoto
            name={current.firstName}
            seed={current.userId}
            photoUrl={current.photoUrl}
            hidden={current.photoHidden}
            className="absolute inset-0 h-full w-full"
            textClassName="text-8xl"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum/90 via-plum/50 to-transparent p-5 pt-24">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-medium text-cream">
                  {current.firstName}
                  <span className="ml-2 font-sans text-base font-normal text-cream/70">
                    {current.ageBand}
                  </span>
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-cream/80">
                  <MapPin className="size-3.5" />
                  {current.city
                    ? `${current.city}, ${countryName(lang, current.country)}`
                    : countryName(lang, current.country)}
                </p>
                {current.profession && (
                  <p className="mt-0.5 text-sm text-cream/70">{current.profession}</p>
                )}
                {current.reliabilityScore >= 70 && (
                  <p className="mt-1 text-xs text-cream/70">
                    ★ {t("reliability")} {current.reliabilityScore}
                  </p>
                )}
                {current.reportFlag && (
                  <p className="mt-1 text-xs text-amber-200/90">⚠ {t("reportFlagHint")}</p>
                )}
              </div>
              <button
                type="button"
                onClick={askWhy}
                className="rounded-full bg-cream/10 px-2.5 py-1 text-xs tabular-nums text-cream"
              >
                {current.score}%
              </button>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cream/90">
              {current.bio}
            </p>
            <UniverseFacts universe={current.matchUniverse} data={current.universeData} />
            {current.matchUniverse === "mariage" && current.universeData.lookingForText && (
              <p className="mt-2 text-sm italic text-muted-foreground">
                {t("lookingForShort")} : {current.universeData.lookingForText}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {current.meetRating !== null && (
                <Badge tone="ok">
                  ★ {current.meetRating.toFixed(1)} · {current.meetCount} {t("repMeetings")}
                </Badge>
              )}
              {current.tripRating !== null && (
                <Badge tone="ok">
                  ★ {current.tripRating.toFixed(1)} · {current.tripReviewCount} {t("repTrips")}
                </Badge>
              )}
              {current.matchUniverse === "voyage" &&
                current.universeData.travelGoal === "guide" &&
                current.verificationStatus === "verifie" && (
                  <Badge tone="ok">
                    <ShieldCheck className="mr-1 size-3" />
                    {t("guideVerified")}
                  </Badge>
                )}
            </div>
            {current.matchUniverse === "projets" &&
              (current.impactStories ?? []).slice(0, 2).map((s, i) => (
                <p key={i} className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">✦ {s.title}</span> — {s.summary}
                </p>
              ))}
            {(current.reasons ?? []).length > 0 && (
              <p className="mt-2 text-xs text-primary">
                ✦ {(current.reasons ?? []).map((r) => t(r)).join(" · ")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(current.universes ?? []).map((u, i) => (
                <Badge key={u} tone={i === 0 ? "primary" : undefined}>
                  {t(u)}
                </Badge>
              ))}
              {current.matchUniverse === "mariage" && <Badge>{t(current.familyStatus)}</Badge>}
              {current.proDomain && <Badge>{t(current.proDomain)}</Badge>}
              {current.idDocumentStatus === "verifie" && (
                <Badge tone="ok">
                  <ShieldCheck className="mr-1 size-3" />
                  {t("idVerified")}
                </Badge>
              )}
              {current.verificationStatus === "verifie" && (
                <Badge tone="ok">
                  <ShieldCheck className="mr-1 size-3" />
                  {t("verified")}
                </Badge>
              )}
              {current.responsiveFast && <Badge tone="ok">{t("respondsFast")}</Badge>}
            </div>
          </div>
          {current.alreadyLiked && (
            <div className="absolute right-4 top-4 rotate-12 rounded-lg border border-primary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              {t("youLike")}
            </div>
          )}
          {current.isDemo && (
            <div className="absolute left-4 top-4 rounded-full bg-plum/50 px-2.5 py-1 text-[10px] uppercase tracking-wider text-cream/80">
              {t("demoHint").split("—")[0]}
            </div>
          )}
        </div>
      </SwipeCard>

      <div className="mt-3 space-y-2">
        <p className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t("likeOnTitle")}
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {(["profile", "photo", "bio", "reason"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setLikedOn(k)}
              className={`rounded-full border px-2.5 py-1 text-xs min-h-[2.5rem] ${
                likedOn === k
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {t(`likeOn_${k}`)}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={likeNote}
          onChange={(e) => setLikeNote(e.target.value.slice(0, 200))}
          placeholder={t("likeNotePh")}
          maxLength={200}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="mt-4 flex items-center justify-center gap-5">
        <Button
          variant="outline"
          size="icon"
          aria-label={t("pass")}
          className="h-16 w-16"
          onClick={pass}
          disabled={busy}
        >
          <X className="size-7 text-muted-foreground" />
        </Button>
        <Button
          size="icon"
          aria-label={t("like")}
          className="h-16 w-16"
          onClick={like}
          disabled={busy}
        >
          <Heart className="size-7" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="ghost" size="sm" onClick={askWhy}>
          <Sparkles className="size-3.5" />
          {t("whyMatch")}
        </Button>
        <Button variant="ghost" size="sm" onClick={askIce}>
          {t("icebreaker")}
        </Button>
      </div>
      {(insight || ice) && (
        <div className="mt-3 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/90">
          {insight && <p>{insight}</p>}
          {ice && <p className="text-muted-foreground">{ice}</p>}
        </div>
      )}

      {spark && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-plum/70 px-6"
          onClick={() => setSpark(null)}
        >
          <div
            className="app-shell rounded-[28px] border border-border bg-card p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ProfilePhoto
              name={spark.firstName}
              seed={spark.userId}
              photoUrl={spark.photoUrl}
              className="mx-auto size-20 rounded-full"
              textClassName="text-2xl"
            />
            <h3 className="mt-5 font-display text-3xl font-medium">
              {t("matchTitle")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("matchLead")}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setSpark(null)}>
                {t("keepBrowsing")}
              </Button>
              <Button onClick={() => setSpark(null)}>{t("write")}</Button>
            </div>
          </div>
        </div>
      )}

      {filtersOpen && (
        <FilterSheet
          draft={draft}
          setDraft={setDraft}
          universe={filters.intention}
          onClose={() => setFiltersOpen(false)}
          onApply={() => {
            onFilters(draft);
            setFiltersOpen(false);
          }}
        />
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground"
    >
      {children}
    </button>
  );
}

function SwipeCard({
  children,
  onLike,
  onPass,
}: {
  children: React.ReactNode;
  onLike: () => void;
  onPass: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const dragging = useRef(false);
  const [dx, setDx] = useState(0);

  const onDown = (x: number) => {
    dragging.current = true;
    startX.current = x;
  };
  const onMove = (x: number) => {
    if (!dragging.current) return;
    setDx(x - startX.current);
  };
  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dx > 88) onLike();
    else if (dx < -88) onPass();
    setDx(0);
  };

  return (
    <div
      ref={ref}
      className="touch-pan-y"
      style={{
        transform: `translateX(${dx}px) rotate(${dx / 28}deg)`,
        transition: dragging.current ? "none" : "transform 180ms cubic-bezier(0.22,1,0.36,1)",
      }}
      onPointerDown={(e) => onDown(e.clientX)}
      onPointerMove={(e) => onMove(e.clientX)}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {children}
    </div>
  );
}

/** Recherche simple en langage naturel → filtres (sans IA externe). */
function FindMeBox({
  filters,
  onFilters,
}: {
  filters: DiscoverFilters;
  onFilters: (f: DiscoverFilters) => void;
}) {
  const { t, lang } = useLang();
  const [q, setQ] = useState("");
  const apply = () => {
    const raw = q.trim().toLowerCase();
    if (!raw) return;
    const next = { ...filters };
    for (const g of GENDERS) {
      if (raw.includes(g) || raw.includes(t(g).toLowerCase())) next.gender = g;
    }
    for (const a of AGE_BANDS) {
      if (raw.includes(a)) next.ageBand = a;
    }
    for (const f of FAMILY_STATUSES) {
      if (raw.includes(f) || raw.includes(t(f).toLowerCase())) next.familyStatus = f;
    }
    for (const c of sortedCountryCodes()) {
      const name = countryName(lang, c).toLowerCase();
      if (raw.includes(name) || raw.includes(c.toLowerCase())) {
        if (!next.countries.includes(c)) next.countries = [...next.countries, c];
      }
    }
    onFilters(next);
  };
  return (
    <div className="mb-3 flex gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && apply()}
        placeholder={t("findMePh")}
        className="min-h-[2.75rem] flex-1 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
      />
      <Button type="button" variant="outline" className="min-h-[2.75rem]" onClick={apply}>
        {t("findMe")}
      </Button>
    </div>
  );
}

function CuratedSuggestions() {
  const { t } = useLang();
  const [items, setItems] = useState<CuratedSuggestion[] | null>(null);
  useEffect(() => {
    void listMySuggestions()
      .then((list) => setItems(Array.isArray(list) ? list : []))
      .catch(() => setItems([]));
  }, []);
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3 space-y-2">
      <p className="text-xs font-medium text-primary">{t("curatedTitle")}</p>
      {items.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
        >
          <ProfilePhoto
            name={s.firstName}
            seed={s.userId}
            photoUrl={s.photoUrl}
            className="size-12 shrink-0 rounded-full"
            textClassName="text-lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{s.firstName}</p>
            <p className="truncate text-xs text-muted-foreground">{s.note || t("curatedHint")}</p>
          </div>
          <button
            type="button"
            aria-label={t("dismiss")}
            className="text-muted-foreground"
            onClick={async () => {
              await dismissSuggestion({ data: { id: s.id } });
              setItems((prev) => (prev ?? []).filter((x) => x.id !== s.id));
            }}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
