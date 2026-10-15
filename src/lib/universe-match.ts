/**
 * Intelligence des univers NAYORA — logique pure (sans dépendance), testée par
 * `scripts/universe-match.test.mjs`.
 */

export const PRO_GOALS = ["emploi", "recrute", "associe", "mentor_cherche", "mentor_offre", "affaires"] as const;
export const PRO_GOAL_COMPLEMENT: Record<string, string> = {
  associe: "associe",
  mentor_cherche: "mentor_offre",
  mentor_offre: "mentor_cherche",
  recrute: "emploi",
  emploi: "recrute",
  affaires: "affaires",
};
export const BIZ_SIDES = ["clients", "fournisseurs", "partenaires"] as const;
const BIZ_COMPLEMENT: Record<string, string> = { clients: "fournisseurs", fournisseurs: "clients", partenaires: "partenaires" };

export const FRIEND_GOALS = ["cercle", "communaute", "activites"] as const;
export const INTERESTS = [
  "sport", "musique", "cuisine", "culture", "spiritualite",
  "nature", "tech", "lecture", "jeux", "benevolat",
] as const;

export const TRAVEL_GOALS = ["compagnon", "chercher_guide", "guide"] as const;
export const TRAVEL_STYLES = ["culture", "aventure", "detente", "gastronomie", "roadtrip", "festival"] as const;
export const TRAVEL_WHEN = ["30j", "3m", "annee", "flex"] as const;
export const TRAVEL_BUDGETS = ["eco", "confort", "premium"] as const;
export const YES_NO = ["oui", "non"] as const;

export const PROJECT_ROLES = ["porteur", "rejoindre", "transmettre", "apprendre"] as const;
export const PROJECT_ROLE_COMPLEMENT: Record<string, { best: string[]; partial: string[] }> = {
  porteur: { best: ["rejoindre"], partial: ["transmettre", "apprendre"] },
  rejoindre: { best: ["porteur"], partial: [] },
  transmettre: { best: ["apprendre"], partial: ["porteur"] },
  apprendre: { best: ["transmettre"], partial: ["porteur"] },
};

export type UniverseData = {
  proGoal?: string;
  focusDomains?: string[];
  proStage?: string;
  proNeed?: string[];
  proLevel?: string;
  proExperience?: string;
  contractTypes?: string[];
  bizSide?: string;
  meetFormat?: string[];
  friendGoal?: string;
  interests?: string[];
  groupFormat?: string;
  communityType?: string;
  availability?: string[];
  socialVibe?: string;
  travelGoal?: string;
  travelStyles?: string[];
  travelWhen?: string;
  travelBudget?: string;
  travelDates?: string;
  destinationCountries?: string[];
  openToHost?: string;
  companionGender?: string;
  tripDuration?: string;
  projectRole?: string;
  projectCauses?: string[];
  projectStage?: string;
  projectCommit?: string;
  learnTopics?: string[];
  learnFormat?: string;
  skillsOffer?: string[];
  skillsWant?: string[];
  loveGoal?: string;
  hasChildren?: string;
  wantsChildren?: string;
  originCountry?: string;
  openToDiaspora?: string;
  religion?: string;
  faithPractice?: string;
  values?: string[];
  loveHorizon?: string;
  partnerAgeMin?: number;
  partnerAgeMax?: number;
  partnerMinHeight?: number;
  partnerValues?: string[];
  religionImportance?: string;
  lookingForText?: string;
  polygamy?: string;
  passportCountry?: string;
  heightCm?: number;
};

export type FieldSpec = {
  key: keyof UniverseData;
  kind: "single" | "multi" | "int" | "text";
  source: readonly string[] | "countries" | "domains";
  label: string;
  prefix: string;
  max?: number;
  range?: [number, number];
  group?: string;
  hint?: string;
};
export type GoalSpec = { field: keyof UniverseData; options: readonly string[]; prefix: string; label: string };
export type FormSpec = {
  goal?: GoalSpec;
  common: FieldSpec[];
  byGoal: Record<string, FieldSpec[]>;
  groups?: string[];
};

const f = (
  key: keyof UniverseData,
  kind: FieldSpec["kind"],
  source: FieldSpec["source"],
  label: string,
  prefix: string,
  extra: Partial<Pick<FieldSpec, "max" | "range" | "group" | "hint">> = {},
): FieldSpec => ({ key, kind, source, label, prefix, ...extra });

const CONTRACTS = ["cdi", "freelance", "stage"] as const;
const COMMUNITIES = ["diaspora", "ville", "association", "foi", "etudiants"] as const;
const AVAILABILITY = ["semaine", "weekend", "soir"] as const;
const GROUP_FORMATS = ["duo", "petit", "grand"] as const;
const PRO_STAGES = ["idee", "demarrage", "croissance"] as const;
const PRO_NEEDS = ["competences", "financement", "reseau"] as const;
const PRO_LEVELS = ["debutant", "intermediaire", "confirme"] as const;
const PRO_EXPERIENCE = ["5", "10", "20"] as const;
const PROJECT_STAGES = ["idee", "prototype", "lance"] as const;
const PROJECT_COMMIT = ["1h", "2h", "5h", "mitemps", "pleintemps"] as const;
const LEARN_FORMATS = ["individuel", "groupe", "en_ligne"] as const;
export const LOVE_HORIZONS = ["1an", "3ans", "sans_pression"] as const;
export const LOVE_GOALS = ["mariage", "serieuse"] as const;
/** Nombre d'enfants : aucun, ou 1 à 10. Anciennes valeurs one/several acceptées en lecture. */
export const CHILDREN = ["none", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
export const WANTS_CHILDREN = ["yes", "no", "open"] as const;
export const RELIGIONS = [
  "catholique", "protestant", "evangelique", "chretien_autre",
  "musulman", "traditionnelle", "sans_religion", "autre",
] as const;
const CHRISTIAN: readonly string[] = ["catholique", "protestant", "evangelique", "chretien_autre"];
export const FAITH_PRACTICE = ["pratiquant", "croyant", "peu"] as const;
export const RELIGION_IMPORTANCE = ["essentiel", "souhaite", "indifferent"] as const;
export const POLYGAMY = ["non", "oui", "discuter"] as const;
export const VALUES = ["foi", "famille", "respect", "fidelite", "honnetete", "ambition", "humour", "maturite"] as const;
export const SOCIAL_VIBES = ["calme", "convivial", "anime"] as const;
export const MEET_FORMATS = ["visio", "presentiel", "messages"] as const;
export const COMPANION_GENDER = ["tous", "femmes"] as const;
export const TRIP_DURATIONS = ["weekend", "semaines", "mois"] as const;
export const PROJECT_CAUSES = [
  "education", "sante", "agriculture", "environnement",
  "entrepreneuriat", "culture", "numerique", "inclusion",
] as const;

export const UNIVERSE_FORMS: Record<string, FormSpec> = {
  mariage: {
    goal: { field: "loveGoal", options: LOVE_GOALS, prefix: "lg_", label: "lbl_loveGoal" },
    groups: ["lbl_g_about", "lbl_g_values", "lbl_g_seeking"],
    common: [
      f("hasChildren", "single", CHILDREN, "lbl_childrenCount", "kids_", { group: "lbl_g_about" }),
      f("originCountry", "single", "countries", "lbl_originCountry", "", { group: "lbl_g_about", hint: "hint_originCountry" }),
      f("openToDiaspora", "single", YES_NO, "lbl_openToDiaspora", "yn_", { hint: "hint_diaspora" }),
      f("interests", "multi", INTERESTS, "lbl_interests", "int_", { max: 6 }),
      f("religion", "single", RELIGIONS, "lbl_religion", "rel_", { group: "lbl_g_values", hint: "sensitiveHint" }),
      f("faithPractice", "single", FAITH_PRACTICE, "lbl_faithPractice", "fp_"),
      f("values", "multi", VALUES, "lbl_values", "vl_", { max: 4 }),
      f("loveHorizon", "single", LOVE_HORIZONS, "lbl_loveHorizon", "lh_", { group: "lbl_g_seeking" }),
      f("partnerAgeMin", "int", [], "lbl_partnerAgeMin", "", { range: [18, 80] }),
      f("partnerAgeMax", "int", [], "lbl_partnerAgeMax", "", { range: [18, 80] }),
      f("partnerMinHeight", "int", [], "lbl_partnerMinHeight", "", { range: [140, 210] }),
      f("partnerValues", "multi", VALUES, "lbl_partnerValues", "vl_", { max: 4 }),
      f("religionImportance", "single", RELIGION_IMPORTANCE, "lbl_religionImportance", "ri_"),
      f("lookingForText", "text", [], "lbl_lookingForText", "", { max: 240 }),
    ],
    byGoal: {
      mariage: [
        f("wantsChildren", "single", WANTS_CHILDREN, "lbl_wantsChildren", "wk_", { group: "lbl_g_about" }),
        f("polygamy", "single", POLYGAMY, "lbl_openPolygamy", "poly_", { group: "lbl_g_values" }),
      ],
      serieuse: [],
    },
  },
  professionnel: {
    goal: { field: "proGoal", options: PRO_GOALS, prefix: "pg_", label: "lbl_proGoal" },
    common: [f("meetFormat", "multi", MEET_FORMATS, "lbl_meetFormat", "mf_")],
    byGoal: {
      emploi: [
        f("focusDomains", "multi", "domains", "lbl_focus_emploi", "", { max: 3 }),
        f("contractTypes", "multi", CONTRACTS, "lbl_contractTypes", "ct_"),
        f("proExperience", "single", PRO_EXPERIENCE, "lbl_proExperience", "xpy_"),
      ],
      recrute: [
        f("focusDomains", "multi", "domains", "lbl_focus_recrute", "", { max: 3 }),
        f("contractTypes", "multi", CONTRACTS, "lbl_contractTypes", "ct_"),
      ],
      associe: [
        f("focusDomains", "multi", "domains", "lbl_focus_associe", "", { max: 3 }),
        f("proStage", "single", PRO_STAGES, "lbl_proStage", "st_"),
        f("proNeed", "multi", PRO_NEEDS, "lbl_proNeed", "need_"),
      ],
      mentor_cherche: [
        f("focusDomains", "multi", "domains", "lbl_focus_mentor_cherche", "", { max: 3 }),
        f("proLevel", "single", PRO_LEVELS, "lbl_proLevel", "lvl_"),
      ],
      mentor_offre: [
        f("focusDomains", "multi", "domains", "lbl_focus_mentor_offre", "", { max: 3 }),
        f("proExperience", "single", PRO_EXPERIENCE, "lbl_proExperience", "xpy_"),
      ],
      affaires: [
        f("focusDomains", "multi", "domains", "lbl_focus_affaires", "", { max: 3 }),
        f("bizSide", "single", BIZ_SIDES, "lbl_bizSide", "biz_"),
      ],
    },
  },
  amitie: {
    goal: { field: "friendGoal", options: FRIEND_GOALS, prefix: "fg_", label: "lbl_friendGoal" },
    common: [
      f("interests", "multi", INTERESTS, "lbl_interests", "int_", { max: 6 }),
      f("socialVibe", "single", SOCIAL_VIBES, "lbl_socialVibe", "sv_"),
      f("originCountry", "single", "countries", "lbl_originCountry", "", { hint: "hint_originCountry" }),
      f("openToDiaspora", "single", YES_NO, "lbl_openToDiaspora", "yn_", { hint: "hint_diaspora" }),
    ],
    byGoal: {
      cercle: [f("groupFormat", "single", GROUP_FORMATS, "lbl_groupFormat", "gf_")],
      communaute: [f("communityType", "single", COMMUNITIES, "lbl_communityType", "cm_")],
      activites: [f("availability", "multi", AVAILABILITY, "lbl_availability", "av_")],
    },
  },
  voyage: {
    goal: { field: "travelGoal", options: TRAVEL_GOALS, prefix: "tg_", label: "lbl_travelGoal" },
    common: [
      f("travelStyles", "multi", TRAVEL_STYLES, "lbl_travelStyles", "ts_", { max: 4 }),
      f("travelWhen", "single", TRAVEL_WHEN, "lbl_travelWhen", "tw_"),
      f("travelBudget", "single", TRAVEL_BUDGETS, "lbl_travelBudget", "tb_"),
      f("travelDates", "text", [], "lbl_travelDates", "", { max: 120, hint: "hint_travelDates" }),
      f("destinationCountries", "multi", "countries", "lbl_destinationCountries", "", { max: 5 }),
      f("openToHost", "single", YES_NO, "lbl_openToHost", "yn_"),
      f("companionGender", "single", COMPANION_GENDER, "lbl_companionGender", "cg_"),
      f("tripDuration", "single", TRIP_DURATIONS, "lbl_tripDuration", "td_"),
      f("passportCountry", "single", "countries", "lbl_passportCountry", "", { hint: "hint_passport" }),
    ],
    byGoal: {
      compagnon: [],
      chercher_guide: [],
      guide: [],
    },
  },
  projets: {
    goal: { field: "projectRole", options: PROJECT_ROLES, prefix: "pr_", label: "lbl_projectRole" },
    common: [
      f("projectCauses", "multi", PROJECT_CAUSES, "lbl_projectCauses", "pc_", { max: 4 }),
      f("projectStage", "single", PROJECT_STAGES, "lbl_projectStage", "ps_"),
      f("projectCommit", "single", PROJECT_COMMIT, "lbl_projectCommit", "pm_"),
      f("skillsOffer", "multi", "domains", "lbl_skillsOffer", "", { max: 4 }),
      f("skillsWant", "multi", "domains", "lbl_skillsWant", "", { max: 4 }),
      f("learnTopics", "multi", "domains", "lbl_learnTopics", "", { max: 4 }),
      f("learnFormat", "single", LEARN_FORMATS, "lbl_learnFormat", "lf_"),
    ],
    byGoal: {
      porteur: [],
      rejoindre: [],
      transmettre: [],
      apprendre: [],
    },
  },
};

export function fieldsFor(universe: string, data: UniverseData): FieldSpec[] {
  const form = UNIVERSE_FORMS[universe];
  if (!form) return [];
  const goalField = form.goal?.field;
  const goalVal = goalField ? (data[goalField] as string | undefined) : undefined;
  const byGoal = goalVal && form.byGoal[goalVal] ? form.byGoal[goalVal] : [];
  return [...form.common, ...byGoal];
}

export const UNIVERSE_FACETS: Record<
  string,
  { field: keyof UniverseData; label: string; options: readonly string[]; prefix: string }
> = {
  professionnel: { field: "proGoal", label: "lbl_facet_professionnel", options: PRO_GOALS, prefix: "fc_" },
  amitie: { field: "interests", label: "lbl_interests", options: INTERESTS, prefix: "int_" },
  voyage: { field: "travelGoal", label: "lbl_facet_voyage", options: TRAVEL_GOALS, prefix: "fc_" },
  projets: { field: "projectRole", label: "lbl_facet_projets", options: PROJECT_ROLES, prefix: "fc_" },
};

const uniq = (arr: string[]) => Array.from(new Set(arr));
const inter = (a: string[] = [], b: string[] = []) => a.filter((x) => b.includes(x));

export function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  const noControl = Array.from(v)
    .map((c) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? " " : c))
    .join("");
  return noControl
    .replace(/https?:\/\/\S+|www\.\S+/gi, "")
    .replace(/\S+@\S+\.\S+/g, "")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function sanitizeUniverseData(
  raw: unknown,
  opts: { domains: readonly string[]; countries: readonly string[]; universes?: string[] },
): UniverseData {
  if (!raw || typeof raw !== "object") return {};
  const src = raw as Record<string, unknown>;
  const out: UniverseData = {};
  const universes = opts.universes ?? Object.keys(UNIVERSE_FORMS);
  const allowed = new Set<string>();
  for (const u of universes) {
    const form = UNIVERSE_FORMS[u];
    if (!form) continue;
    if (form.goal) allowed.add(form.goal.field);
    for (const spec of form.common) allowed.add(spec.key);
    for (const specs of Object.values(form.byGoal))
      for (const spec of specs) allowed.add(spec.key);
  }
  for (const key of Object.keys(src) as (keyof UniverseData)[]) {
    if (!allowed.has(key)) continue;
    const v = src[key];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "number") {
      (out as Record<string, unknown>)[key] = v;
      continue;
    }
    if (typeof v === "string") {
      (out as Record<string, unknown>)[key] = cleanText(v, 500);
      continue;
    }
    if (Array.isArray(v)) {
      (out as Record<string, unknown>)[key] = uniq(
        v.filter((x): x is string => typeof x === "string").map((x) => cleanText(x, 80)).filter(Boolean),
      ).slice(0, 8);
    }
  }
  return out;
}

export function parseUniverseData(raw: unknown): UniverseData {
  if (!raw || typeof raw !== "object") return {};
  return sanitizeUniverseData(raw, { domains: [], countries: [] });
}

export type UniverseMatch = { score: number; reasons: string[]; universe: string };

export function scoreUniversePair(
  meU: string,
  themU: string,
  me: UniverseData,
  them: UniverseData,
): UniverseMatch | null {
  if (meU !== themU) return null;
  const reasons: string[] = [];
  let score = 40;
  if (meU === "professionnel") {
    const a = me.proGoal;
    const b = them.proGoal;
    if (a && b) {
      const comp = PRO_GOAL_COMPLEMENT[a];
      if (comp === b) {
        score += 25;
        reasons.push("r_proGoal");
      } else if (a === b) {
        score += 10;
        reasons.push("r_proGoalSame");
      }
      if (comp && (a === "recrute" || a === "emploi") && inter(me.contractTypes, them.contractTypes).length) {
        score += 8;
        reasons.push("r_contract");
      }
    }
    if (inter(me.focusDomains, them.focusDomains).length) {
      score += 12;
      reasons.push("r_domain");
    }
  } else if (meU === "amitie") {
    const shared = inter(me.interests, them.interests);
    if (shared.length) {
      score += Math.min(20, shared.length * 5);
      reasons.push("r_interests");
    }
    if (me.socialVibe && me.socialVibe === them.socialVibe) {
      score += 8;
      reasons.push("r_vibe");
    }
  } else if (meU === "voyage") {
    if (me.travelGoal && them.travelGoal) {
      if (
        (me.travelGoal === "compagnon" && them.travelGoal === "compagnon") ||
        (me.travelGoal === "guide" && them.travelGoal === "chercher_guide") ||
        (me.travelGoal === "chercher_guide" && them.travelGoal === "guide")
      ) {
        score += 20;
        reasons.push("r_travelGoal");
      }
    }
    if (inter(me.travelStyles, them.travelStyles).length) {
      score += 10;
      reasons.push("r_travelStyle");
    }
    if (inter(me.destinationCountries, them.destinationCountries).length) {
      score += 10;
      reasons.push("r_destination");
    }
  } else if (meU === "projets") {
    const role = me.projectRole && them.projectRole ? PROJECT_ROLE_COMPLEMENT[me.projectRole] : null;
    if (role && them.projectRole) {
      if (role.best.includes(them.projectRole)) score += 20;
      else if (role.partial.includes(them.projectRole)) score += 10;
    }
    if (inter(me.projectCauses, them.projectCauses).length) {
      score += 12;
      reasons.push("r_cause");
    }
  } else if (meU === "mariage") {
    score += 5;
    if (me.loveGoal && them.loveGoal && me.loveGoal === them.loveGoal) {
      score += 10;
      reasons.push("r_loveGoal");
    }
    if (inter(me.values, them.values).length) {
      score += 10;
      reasons.push("r_values");
    }
  }
  return { score: Math.min(98, score), reasons, universe: meU };
}
