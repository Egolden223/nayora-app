import {
  AGE_BANDS,
  COUNTRY_CODES,
  FAMILY_STATUSES,
  GENDERS,
} from "@/lib/constants";
import type { DiscoverFilters } from "@/lib/dating";
import { countryName, sortedCountryCodes } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";
import { FieldSelect } from "@/components/field-select";
import { Input } from "@/components/ui/input";
import { RELIGIONS, UNIVERSE_FACETS } from "@/lib/universe-match";
import { ShieldCheck } from "lucide-react";

export function FilterSheet({
  draft,
  setDraft,
  universe,
  onClose,
  onApply,
}: {
  draft: DiscoverFilters;
  setDraft: (f: DiscoverFilters) => void;
  universe: string;
  onClose: () => void;
  onApply: () => void;
}) {
  const { t, lang } = useLang();
  const set = (key: keyof DiscoverFilters, value: string) =>
    setDraft({ ...draft, [key]: value });
  // Filtres adaptés à l'univers actif (pas de sélecteur d'univers ici).
  const isLove = universe === "mariage";
  const isFriends = universe === "amitie";
  const isPro = universe === "professionnel";
  const isTravel = universe === "voyage";
  const isProjects = universe === "projets";
  const facet = UNIVERSE_FACETS[universe];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-plum/60 sm:items-center sm:justify-center">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-[28px] border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[28px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl">{t("filters")}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("filtersInUniverse")} — {t(universe)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground">
            {t("keepBrowsing")}
          </button>
        </div>
        <div className="space-y-3">
          {(isLove || isFriends) && (
            <Field
              label={t("gender")}
              value={draft.gender}
              onChange={(v) => set("gender", v)}
              options={["all", ...GENDERS]}
            />
          )}
          {isLove && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {t("ageMin")}
                </p>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={99}
                  placeholder="18"
                  value={draft.ageMin ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft({
                      ...draft,
                      ageMin: v === "" ? undefined : Math.min(99, Math.max(18, Number(v) || 18)),
                      ageBand: "all",
                    });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {t("ageMax")}
                </p>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={99}
                  placeholder="50"
                  value={draft.ageMax ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft({
                      ...draft,
                      ageMax: v === "" ? undefined : Math.min(99, Math.max(18, Number(v) || 18)),
                      ageBand: "all",
                    });
                  }}
                />
              </div>
            </div>
          )}
          {(isFriends || isTravel) && !isLove && (
            <Field
              label={t("ageBand")}
              value={draft.ageBand}
              onChange={(v) => set("ageBand", v)}
              options={["all", ...AGE_BANDS]}
            />
          )}
          {isLove && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("heightMin")}
              </p>
              <Input
                type="number"
                inputMode="numeric"
                min={140}
                max={220}
                placeholder="cm"
                value={draft.heightMin ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft({
                    ...draft,
                    heightMin: v === "" ? undefined : Math.min(220, Math.max(140, Number(v) || 140)),
                  });
                }}
              />
            </div>
          )}
          {isLove && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("lbl_religion")}
              </p>
              <FieldSelect
                value={draft.religion ?? "all"}
                onChange={(v) => setDraft({ ...draft, religion: v })}
              >
                <option value="all">{t("all")}</option>
                {RELIGIONS.map((r) => (
                  <option key={r} value={r}>
                    {t("rel_" + r)}
                  </option>
                ))}
              </FieldSelect>
            </div>
          )}
          {isLove && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("city")} ({t("optional")})
              </p>
              <Input
                type="text"
                placeholder={t("city")}
                value={draft.city ?? ""}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </div>
          )}
          {isLove && (
            <Field
              label={t("family")}
              value={draft.familyStatus}
              onChange={(v) => set("familyStatus", v)}
              options={["all", ...FAMILY_STATUSES]}
            />
          )}
          <button
            type="button"
            aria-pressed={Boolean(draft.verifiedOnly)}
            onClick={() => setDraft({ ...draft, verifiedOnly: !draft.verifiedOnly })}
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm min-h-[2.75rem] ${
              draft.verifiedOnly ? "border-primary bg-card" : "border-border"
            }`}
          >
            <ShieldCheck className="size-4 text-primary" />
            {t("verifiedOnly")}
            {draft.verifiedOnly && <span className="ml-auto text-primary">✓</span>}
          </button>
          {(isLove || isFriends) && (
            <button
              type="button"
              aria-pressed={Boolean(draft.diasporaOnly)}
              onClick={() => setDraft({ ...draft, diasporaOnly: !draft.diasporaOnly })}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm min-h-[2.75rem] ${
                draft.diasporaOnly ? "border-primary bg-card" : "border-border"
              }`}
            >
              {t("diasporaOnly")}
              {draft.diasporaOnly && <span className="ml-auto text-primary">✓</span>}
            </button>
          )}
          {isTravel && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("lbl_passportCountry")}
              </p>
              <FieldSelect
                value={draft.passportCountry ?? "all"}
                onChange={(v) => setDraft({ ...draft, passportCountry: v === "all" ? undefined : v })}
              >
                <option value="all">{t("all")}</option>
                {sortedCountryCodes(lang, COUNTRY_CODES).map((c) => (
                  <option key={c} value={c}>
                    {countryName(lang, c)}
                  </option>
                ))}
              </FieldSelect>
            </div>
          )}
          {facet && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t(facet.label)}
              </p>
              <FieldSelect
                value={draft.facet ?? "all"}
                onChange={(v) => set("facet", v)}
              >
                <option value="all">{t("all")}</option>
                {facet.options.map((o) => (
                  <option key={o} value={o}>
                    {t(facet.prefix + o)}
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
              <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-sm min-h-[2.75rem]">
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
                    className="mb-1 w-full rounded-lg px-2 py-1.5 text-left text-xs text-primary"
                  >
                    {t("clearSelection")}
                  </button>
                )}
                {sortedCountryCodes(lang, COUNTRY_CODES).map((c) => {
                  const on = draft.countries.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          countries: on
                            ? draft.countries.filter((x) => x !== c)
                            : [...draft.countries, c],
                        })
                      }
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                        on ? "bg-primary/10 text-primary" : ""
                      }`}
                    >
                      <span className="size-4 rounded border border-border text-center text-[10px] leading-4">
                        {on ? "✓" : ""}
                      </span>
                      {countryName(lang, c)}
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t("keepBrowsing")}
          </Button>
          <Button className="flex-1" onClick={onApply}>
            {t("applyFilters")}
          </Button>
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
  options: string[];
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
            {o === "all" ? t("all") : t(o)}
          </option>
        ))}
      </FieldSelect>
    </div>
  );
}
