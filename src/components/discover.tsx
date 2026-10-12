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

const EMPTY_FILTERS: DiscoverFilters = {
  ageBand: "all",
  gender: "all",
  intention: "all",
  countries: [],
  familyStatus: "all",
  facet: "all",
};

export function Discover({
  me: _me,
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
      const res = await addLike({ data: { userId: current.userId } });
      if (res.status === "rate_limited") {
        // Limite anti-abus atteinte : on n'avance PAS (le like n'a pas été enregistré).
        setNotice(t("likeLimitReached"));
        return;
      }
      setNotice(null);
      if (res.status === "matched") {
        setSpark(current);
        onMatched(current, res.matchId);
      }
      setIndex((i) => i + 1);
      setInsight(null);
      setIce(null);
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
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-sm flex-col items-center justify-center px-6 text-center">
        <UniverseBar
          className="mb-4 w-full"
          value={filters.intention}
          onChange={(v) => onFilters({ ...filters, intention: v, facet: "all" })}
        />
        <div className="mb-4 flex w-full justify-end">
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
        <h2 className="font-display text-3xl font-medium">{t("endOfDeck")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("endOfDeckLead")}</p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            onFilters(EMPTY_FILTERS);
            onRefresh();
          }}
        >
          {t("widen")}
        </Button>
        {filtersOpen && (
          <FilterSheet
            draft={draft}
            setDraft={setDraft}
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
    <div className="mx-auto app-shell px-4 pb-4">
      <UniverseBar
        className="mb-3"
        value={filters.intention}
        onChange={(v) => onFilters({ ...filters, intention: v, facet: "all" })}
      />
      {notice && <p className="mb-3 rounded-xl bg-secondary px-3 py-2 text-sm text-primary">{notice}</p>}
      <CuratedSuggestions />
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {index + 1} / {cards.length}
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
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[28px] border border-border bg-card shadow-[var(--shadow-soft)]">
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
              current.impactStories.slice(0, 2).map((s, i) => (
                <p key={i} className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">✦ {s.title}</span> — {s.summary}
                </p>
              ))}
            {current.reasons.length > 0 && (
              <p className="mt-2 text-xs text-primary">
                ✦ {current.reasons.map((r) => t(r)).join(" · ")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {current.universes.map((u, i) => (
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

function FilterSheet({
  draft,
  setDraft,
  onClose,
  onApply,
}: {
  draft: DiscoverFilters;
  setDraft: (f: DiscoverFilters) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const { t, lang } = useLang();
  const set = (key: keyof DiscoverFilters, value: string) =>
    setDraft({ ...draft, [key]: value });
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-plum/60 sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-t-[28px] border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[28px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl">{t("filters")}</h3>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground">
            {t("keepBrowsing")}
          </button>
        </div>
        <div className="space-y-3">
          <Field
            label={t("gender")}
            value={draft.gender}
            onChange={(v) => set("gender", v)}
            options={["all", ...GENDERS]}
          />
          <Field
            label={t("ageBand")}
            value={draft.ageBand}
            onChange={(v) => set("ageBand", v)}
            options={["all", ...AGE_BANDS]}
          />
          <Field
            label={t("intention")}
            value={draft.intention}
            onChange={(v) => setDraft({ ...draft, intention: v, facet: "all" })}
            options={["all", ...INTENTIONS]}
          />
          <button
            type="button"
            aria-pressed={Boolean(draft.verifiedOnly)}
            onClick={() => setDraft({ ...draft, verifiedOnly: !draft.verifiedOnly })}
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm ${
              draft.verifiedOnly ? "border-primary bg-card" : "border-border"
            }`}
          >
            <ShieldCheck className="size-4 text-primary" />
            {t("verifiedOnly")}
            {draft.verifiedOnly && <span className="ml-auto text-primary">✓</span>}
          </button>
          {UNIVERSE_FACETS[draft.intention] && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t(UNIVERSE_FACETS[draft.intention].label)}
              </p>
              <FieldSelect
                value={draft.facet ?? "all"}
                onChange={(v) => set("facet", v)}
              >
                <option value="all">{t("all")}</option>
                {UNIVERSE_FACETS[draft.intention].options.map((o) => (
                  <option key={o} value={o}>
                    {t(UNIVERSE_FACETS[draft.intention].prefix + o)}
                  </option>
                ))}
              </FieldSelect>
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("countries")}
            </p>
            <details className="group rounded-2xl border border-border bg-secondary/40">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-sm">
                <span>
                  {draft.countries.length === 0
                    ? t("allCountries")
                    : `${draft.countries.length} ${t("countriesSelected")}`}
                </span>
                <span className="text-muted-foreground transition group-open:rotate-180">⌄</span>
              </summary>
              <div className="max-h-56 overflow-y-auto border-t border-border p-2">
                {draft.countries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, countries: [] })}
                    className="mb-1 w-full rounded-lg px-2 py-1.5 text-left text-xs text-primary hover:bg-secondary"
                  >
                    {t("allCountries")}
                  </button>
                )}
                {sortedCountryCodes(lang, COUNTRY_CODES).map((c) => (
                  <label
                    key={c}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={draft.countries.includes(c)}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          countries: e.target.checked
                            ? [...draft.countries, c]
                            : draft.countries.filter((x) => x !== c),
                        })
                      }
                      className="accent-primary"
                    />
                    {countryName(lang, c)}
                  </label>
                ))}
              </div>
            </details>
          </div>
          <Field
            label={t("family")}
            value={draft.familyStatus}
            onChange={(v) => set("familyStatus", v)}
            options={["all", ...FAMILY_STATUSES]}
          />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => setDraft(EMPTY_FILTERS)}
          >
            {t("resetFilters")}
          </Button>
          <Button onClick={onApply}>{t("applyFilters")}</Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  const { t } = useLang();
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <FieldSelect value={value} onChange={onChange}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? t("all") : t(o) === o ? o : t(o)}
          </option>
        ))}
      </FieldSelect>
    </div>
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

function CuratedSuggestions() {
  const { t } = useLang();
  const [items, setItems] = useState<CuratedSuggestion[] | null>(null);

  useEffect(() => {
    listMySuggestions()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-3 flex flex-col gap-2">
      {items.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-card px-3 py-2.5"
        >
          <ProfilePhoto
            name={s.profile.firstName}
            seed={s.profile.userId}
            photoUrl={s.profile.photoUrl}
            hidden={s.profile.photoHidden}
            className="size-11 rounded-full"
            textClassName="text-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Sparkles className="size-3" /> {t("curatedTitle")}
            </p>
            <p className="truncate text-sm">
              {s.profile.firstName}
              {s.note ? ` — ${s.note}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await dismissSuggestion({ data: { id: s.id } });
              setItems((prev) => prev?.filter((x) => x.id !== s.id) ?? null);
            }}
            className="shrink-0 p-1 text-muted-foreground"
            aria-label={t("pass")}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
