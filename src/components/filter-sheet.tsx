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
          {facet && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t(facet.label)}
              </p>
              <FieldSelect value={draft.facet ?? "all"} onChange={(v) => set("facet", v)}>
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
              {t("country")}
            </p>
            <details className="group rounded-xl border border-border">
              <summary className="flex cursor-pointer items-center justify-between px-3.5 py-2.5 text-sm min-h-[2.75rem]">
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
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary min-h-[2.5rem]"
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
                      className="accent-primary size-4"
                    />
                    {countryName(lang, c)}
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() =>
              setDraft({
                ageBand: "all",
                gender: "all",
                intention: universe,
                countries: [],
                familyStatus: "all",
                facet: "all",
                verifiedOnly: false,
                ageMin: undefined,
                ageMax: undefined,
                heightMin: undefined,
                religion: "all",
                city: "",
              })
            }
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
