import type { ReactNode } from "react";
import { FieldSelect } from "@/components/field-select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRY_CODES, PRO_DOMAINS } from "@/lib/constants";
import { countryName, sortedCountryCodes } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import {
  fieldsFor,
  type FieldSpec,
  UNIVERSE_FORMS,
  type UniverseData,
} from "@/lib/universe-match";
import { cn } from "@/lib/utils";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

function toggle(list: string[] | undefined, value: string, max: number): string[] {
  const cur = list ?? [];
  if (cur.includes(value)) return cur.filter((x) => x !== value);
  return cur.length >= max ? cur : [...cur, value];
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
      <div>
        <p className="text-sm font-medium">RAYINE {title}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

function SingleSelect({
  label,
  value,
  onChange,
  options,
  prefix,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: readonly string[];
  prefix: string;
}) {
  const { t } = useLang();
  return (
    <div>
      <Label>{label}</Label>
      <FieldSelect value={value ?? ""} onChange={onChange}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {t(prefix + o)}
          </option>
        ))}
      </FieldSelect>
    </div>
  );
}

function ChipGroup({
  label,
  selected,
  options,
  onToggle,
  render,
}: {
  label: string;
  selected: string[] | undefined;
  options: readonly string[];
  onToggle: (v: string) => void;
  render: (o: string) => string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} active={(selected ?? []).includes(o)} onClick={() => onToggle(o)}>
            {render(o)}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/** Champ généré depuis le schéma (simple ou multiple, options i18n / domaines / pays). */
function SchemaField({
  spec,
  data,
  onChange,
}: {
  spec: FieldSpec;
  data: UniverseData;
  onChange: (patch: Partial<UniverseData>) => void;
}) {
  const { t, lang } = useLang();
  const options: readonly string[] =
    spec.source === "domains"
      ? PRO_DOMAINS
      : spec.source === "countries"
        ? sortedCountryCodes(lang, COUNTRY_CODES)
        : spec.source;
  const render = (o: string) =>
    spec.source === "countries" ? countryName(lang, o) : spec.source === "domains" ? t(o) : t(spec.prefix + o);
  const value = data[spec.key];
  if (spec.kind === "int") {
    const [lo, hi] = spec.range ?? [0, 999];
    return (
      <div>
        <Label>{t(spec.label)}</Label>
        <Input
          type="number"
          inputMode="numeric"
          min={lo}
          max={hi}
          placeholder={`${lo}–${hi}`}
          value={typeof value === "number" ? String(value) : ""}
          onChange={(e) => {
            const n = e.target.value === "" ? undefined : Number(e.target.value);
            onChange({ [spec.key]: n } as Partial<UniverseData>);
          }}
        />
      </div>
    );
  }
  if (spec.kind === "date") {
    return (
      <div>
        <Label>{t(spec.label)}</Label>
        <Input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) =>
            onChange({ [spec.key]: e.target.value || undefined } as Partial<UniverseData>)
          }
        />
      </div>
    );
  }
  if (spec.kind === "text") {
    const isShort = (spec.max ?? 200) <= 80;
    return (
      <div>
        <Label>{t(spec.label)}</Label>
        {isShort ? (
          <Input
            maxLength={spec.max}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange({ [spec.key]: e.target.value || undefined } as Partial<UniverseData>)}
          />
        ) : (
          <Textarea
            rows={3}
            maxLength={spec.max}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange({ [spec.key]: e.target.value || undefined } as Partial<UniverseData>)}
          />
        )}
      </div>
    );
  }
  if (spec.kind === "single") {
    return (
      <div>
        <Label>{t(spec.label)}</Label>
        <FieldSelect
          value={typeof value === "string" ? value : ""}
          onChange={(v) => onChange({ [spec.key]: v || undefined } as Partial<UniverseData>)}
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {render(o)}
            </option>
          ))}
        </FieldSelect>
      </div>
    );
  }
  const selected = Array.isArray(value) ? value : [];
  return (
    <ChipGroup
      label={t(spec.label)}
      selected={selected}
      options={options}
      onToggle={(v) => {
        const next = toggle(selected, v, spec.max ?? 6);
        onChange({ [spec.key]: next.length ? next : undefined } as Partial<UniverseData>);
      }}
      render={render}
    />
  );
}

/**
 * Formulaire ADAPTATIF de chaque univers choisi : la première question
 * (« que cherchez-vous ? ») détermine les questions suivantes. Changer
 * d'objectif retire les réponses devenues sans objet (le serveur fait de même).
 */
export function UniverseProfileForm({
  universes,
  data,
  onChange,
}: {
  universes: string[];
  data: UniverseData;
  onChange: (d: UniverseData) => void;
}) {
  const { t } = useLang();
  const seen = new Set<string>();
  return (
    <div className="space-y-4">
      {universes.map((u) => {
        const form = UNIVERSE_FORMS[u];
        if (!form) return null;
        const goalValue = form.goal ? (data[form.goal.field] as string | undefined) : undefined;
        return (
          <Section key={u} title={t(u)} hint={t(`uDesc_${u}`)}>
            {form.goal && (
              <SingleSelect
                label={t(form.goal.label)}
                value={goalValue}
                onChange={(v) => {
                  const cleaned: Record<string, unknown> = { ...data };
                  for (const specs of Object.values(form.byGoal))
                    for (const spec of specs) delete cleaned[spec.key];
                  cleaned[form.goal!.field] = v || undefined;
                  onChange(cleaned as UniverseData);
                }}
                options={form.goal.options}
                prefix={form.goal.prefix}
              />
            )}
            {(() => {
              let lastGroup: string | undefined;
              return fieldsFor(u, data).map((spec) => {
                if (seen.has(spec.key)) return null;
                seen.add(spec.key);
                const header = spec.group && spec.group !== lastGroup ? spec.group : null;
                lastGroup = spec.group ?? lastGroup;
                return (
                  <div key={`${spec.key}-${spec.label}`} className="space-y-3">
                    {header && (
                      <p className="pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        {t(header)}
                      </p>
                    )}
                    <SchemaField
                      spec={spec}
                      data={data}
                      onChange={(patch) => onChange({ ...data, ...patch })}
                    />
                    {spec.hint && <p className="text-[11px] text-muted-foreground">{t(spec.hint)}</p>}
                  </div>
                );
              });
            })()}
          </Section>
        );
      })}
    </div>
  );
}

/** Résumé structuré du profil d'un univers (labels + chips) — fiche profil & découverte. */
export function UniverseFacts({ universe, data }: { universe: string; data: UniverseData }) {
  const { t, lang } = useLang();

  type Row = { label: string; chips: string[] };
  const rows: Row[] = [];

  const chipOne = (prefix: string, v: unknown): string | null => {
    if (typeof v !== "string" || !v) return null;
    if (prefix === "kids_") {
      if (v === "one") return t("kids_1");
      if (v === "several") return t("kids_several");
    }
    return t(prefix + v);
  };
  const addOne = (labelKey: string, prefix: string, v: unknown) => {
    const c = chipOne(prefix, v);
    if (c) rows.push({ label: t(labelKey), chips: [c] });
  };
  const addMany = (labelKey: string, values: unknown, n: number, render: (x: string) => string) => {
    if (!Array.isArray(values) || !values.length) return;
    const chips = values.slice(0, n).map((x) => render(String(x))).filter(Boolean);
    if (chips.length) rows.push({ label: t(labelKey), chips });
  };

  switch (universe) {
    case "mariage":
      addOne("lbl_loveGoal", "lg_", data.loveGoal);
      addOne("lbl_religion", "rel_", data.religion);
      addOne("lbl_childrenCount", "kids_", data.hasChildren);
      addOne("lbl_openPolygamy", "poly_", data.polygamy);
      addOne("lbl_loveHorizon", "lh_", data.loveHorizon);
      addMany("lbl_values", data.values, 4, (x) => t("vl_" + x));
      if (data.originCountry) {
        rows.push({ label: t("lbl_originCountry"), chips: [countryName(lang, data.originCountry)] });
      }
      if (data.openToDiaspora === "oui") {
        rows.push({ label: t("lbl_openToDiaspora"), chips: [t("yn_oui_diaspora")] });
      }
      break;
    case "professionnel":
      addOne("lbl_proGoal", "pg_", data.proGoal);
      addMany("lbl_focusDomains", data.focusDomains, 3, (x) => t(x));
      addOne("lbl_proStage", "st_", data.proStage);
      addOne("lbl_bizSide", "biz_", data.bizSide);
      break;
    case "amitie":
      addOne("lbl_friendGoal", "fg_", data.friendGoal);
      addOne("lbl_communityType", "cm_", data.communityType);
      addMany("lbl_interests", data.interests, 4, (x) => t("int_" + x));
      break;
    case "voyage":
      addOne("lbl_travelGoal", "tg_", data.travelGoal);
      addMany("lbl_travelStyles", data.travelStyles, 3, (x) => t("ts_" + x));
      addMany("lbl_travelDestinations", data.travelDestinations, 4, (x) => countryName(lang, x));
      addOne("lbl_travelWhen", "tw_", data.travelWhen);
      if (data.travelDateFrom && data.travelDateTo) {
        rows.push({
          label: t("lbl_travelDates"),
          chips: [`${data.travelDateFrom} → ${data.travelDateTo}`],
        });
      }
      if (data.passportCity || data.passportCountry) {
        rows.push({
          label: t("lbl_passportShort"),
          chips: [
            [data.passportCity, data.passportCountry ? countryName(lang, data.passportCountry) : ""]
              .filter(Boolean)
              .join(", "),
          ],
        });
      }
      break;
    case "projets":
      addOne("lbl_projectRole", "pr_", data.projectRole);
      if (typeof data.projectDomain === "string" && data.projectDomain) {
        rows.push({ label: t("lbl_projectDomain"), chips: [t(data.projectDomain)] });
      }
      addMany("lbl_skillsOffer", data.skillsOffer, 3, (x) => t(x));
      addMany("lbl_skillsWant", data.skillsWant, 3, (x) => t(x));
      break;
  }

  if (!rows.length) return null;

  return (
    <div className="mt-2 w-full rounded-2xl border border-border bg-card/60 p-3 text-left">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {t(universe)}
      </p>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="mb-1 text-[11px] text-muted-foreground">{row.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {row.chips.map((c) => (
                <Badge key={c}>{c}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
