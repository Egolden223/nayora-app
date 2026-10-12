/**
 * Intelligence des univers NAYORA — logique pure (sans dépendance), testée par
 * `scripts/universe-match.test.mjs`.
 *
 * Chaque univers a son propre formulaire, ADAPTATIF : la première question
 * (« que cherchez-vous ? ») détermine les questions suivantes (UNIVERSE_FORMS).
 * Le même schéma sert à rendre le formulaire, nettoyer les données côté
 * serveur et calculer l'appariement :
 *  - Love     : affinités profondes et respect (valeurs, langage de l'amour, horizon de vie)
 *  - Friends  : élargir son cercle, intégration communautaire (intérêts, communauté, disponibilités)
 *  - Pro      : réseau d'affaires, associés, mentorat, recrutement (objectifs COMPLÉMENTAIRES)
 *  - Travel   : compagnons de voyage et guides locaux (styles, destinations, période, budget)
 *  - Projects : collaboration sur projets à impact, partage de savoirs (rôles et compétences complémentaires)
 */

export const PRO_GOALS = ["associe", "mentor_cherche", "mentor_offre", "recrute", "emploi", "affaires"] as const;
/** Chaque objectif pro cherche son complément : mentor↔mentoré, recruteur↔candidat… */
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

export const PROJECT_ROLES = ["porteur", "rejoindre", "transmettre", "apprendre"] as const;
/** Rôle complémentaire parfait (best) et partiel. */
export const PROJECT_ROLE_COMPLEMENT: Record<string, { best: string[]; partial: string[] }> = {
  porteur: { best: ["rejoindre"], partial: ["transmettre", "apprendre"] },
  rejoindre: { best: ["porteur"], partial: [] },
  transmettre: { best: ["apprendre"], partial: ["porteur"] },
  apprendre: { best: ["transmettre"], partial: ["porteur"] },
};

export type UniverseData = {
  // Pro
  proGoal?: string;
  focusDomains?: string[];
  proStage?: string;
  proNeed?: string[];
  proLevel?: string;
  proExperience?: string;
  contractTypes?: string[];
  bizSide?: string;
  meetFormat?: string[];
  // Friends
  friendGoal?: string;
  interests?: string[];
  groupFormat?: string;
  communityType?: string;
  availability?: string[];
  socialVibe?: string;
  // Travel
  travelGoal?: string;
  travelStyles?: string[];
  travelDestinations?: string[];
  travelWhen?: string;
  travelBudget?: string;
  companionGender?: string;
  tripDuration?: string;
  // Projects
  projectRole?: string;
  projectDomain?: string;
  projectCause?: string;
  projectStage?: string;
  projectCommit?: string;
  learnFormat?: string;
  skillsOffer?: string[];
  skillsWant?: string[];
  // Love
  loveGoal?: string;
  loveHorizon?: string;
  hasChildren?: string;
  wantsChildren?: string;
  religion?: string;
  faithPractice?: string;
  religionImportance?: string;
  polygamy?: string;
  values?: string[];
  partnerValues?: string[];
  partnerAgeMin?: number;
  partnerAgeMax?: number;
  partnerMinHeight?: number;
  lookingForText?: string;
};

/* ------------------------------------------------------------------ */
/* Schéma de formulaire adaptatif                                       */
/* ------------------------------------------------------------------ */

export type FieldSpec = {
  key: keyof UniverseData;
  kind: "single" | "multi" | "int" | "text";
  /** Liste fermée d'options, ou 'domains' / 'countries' (fournis par l'appelant). */
  source: readonly string[] | "domains" | "countries";
  /** multi : nb max de choix · text : longueur max. */
  max?: number;
  /** int : bornes [min, max]. */
  range?: [number, number];
  /** Clé i18n du libellé. */
  label: string;
  /** Préfixe i18n des options ("" = l'option est déjà une clé i18n ; domaines). */
  prefix: string;
  /** Sous-titre de section (clé i18n) — regroupe les champs, voir FormSpec.groups. */
  group?: string;
  /** Texte d'aide sous le champ (clé i18n). */
  hint?: string;
};
export type GoalSpec = { field: keyof UniverseData; options: readonly string[]; prefix: string; label: string };
export type FormSpec = {
  goal?: GoalSpec;
  common: FieldSpec[];
  byGoal: Record<string, FieldSpec[]>;
  /** Ordre d'affichage des groupes (les champs sans groupe héritent du précédent). */
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
export const CHILDREN = ["none", "one", "several"] as const;
export const WANTS_CHILDREN = ["yes", "no", "open"] as const;
/** Religion déclarée (facultative). Familles chrétiennes : voir CHRISTIAN. */
export const RELIGIONS = [
  "catholique", "protestant", "evangelique", "chretien_autre",
  "musulman", "traditionnelle", "sans_religion", "autre",
] as const;
const CHRISTIAN: readonly string[] = ["catholique", "protestant", "evangelique", "chretien_autre"];
export const FAITH_PRACTICE = ["pratiquant", "croyant", "peu"] as const;
export const RELIGION_IMPORTANCE = ["essentiel", "souhaite", "indifferent"] as const;
export const POLYGAMY = ["non", "oui", "discuter"] as const;
/** Valeurs/qualités : « mes valeurs » et « ce que je recherche chez l'autre ». */
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
      f("hasChildren", "single", CHILDREN, "lbl_hasChildren", "kids_", { group: "lbl_g_about" }),
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
      // Le mariage ouvre les questions de vie de couple (projet familial, polygamie).
      mariage: [
        f("wantsChildren", "single", WANTS_CHILDREN, "lbl_wantsChildren", "wk_", { group: "lbl_g_about" }),
        f("polygamy", "single", POLYGAMY, "lbl_polygamy", "poly_", { group: "lbl_g_values" }),
      ],
      serieuse: [],
    },
  },
  professionnel: {
    goal: { field: "proGoal", options: PRO_GOALS, prefix: "pg_", label: "lbl_proGoal" },
    common: [f("meetFormat", "multi", MEET_FORMATS, "lbl_meetFormat", "mf_")],
    byGoal: {
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
      recrute: [
        f("focusDomains", "multi", "domains", "lbl_focus_recrute", "", { max: 3 }),
        f("contractTypes", "multi", CONTRACTS, "lbl_contractTypes", "ct_"),
      ],
      emploi: [
        f("focusDomains", "multi", "domains", "lbl_focus_emploi", "", { max: 3 }),
        f("contractTypes", "multi", CONTRACTS, "lbl_contractTypes", "ct_"),
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
      f("companionGender", "single", COMPANION_GENDER, "lbl_companionGender", "cg_"),
    ],
    byGoal: {
      compagnon: [
        f("travelDestinations", "multi", "countries", "lbl_travelDestinations", "", { max: 3 }),
        f("travelWhen", "single", TRAVEL_WHEN, "lbl_travelWhen", "tw_"),
        f("tripDuration", "single", TRIP_DURATIONS, "lbl_tripDuration", "td_"),
        f("travelBudget", "single", TRAVEL_BUDGETS, "lbl_travelBudget", "bd_"),
      ],
      chercher_guide: [
        f("travelDestinations", "multi", "countries", "lbl_destGuideWanted", "", { max: 3 }),
        f("travelWhen", "single", TRAVEL_WHEN, "lbl_travelWhen", "tw_"),
      ],
      guide: [f("travelDestinations", "multi", "countries", "lbl_destGuideOffer", "", { max: 3 })],
    },
  },
  projets: {
    goal: { field: "projectRole", options: PROJECT_ROLES, prefix: "pr_", label: "lbl_projectRole" },
    common: [f("projectCause", "single", PROJECT_CAUSES, "lbl_projectCause", "cause_")],
    byGoal: {
      porteur: [
        f("projectDomain", "single", "domains", "lbl_pd_porteur", ""),
        f("projectStage", "single", PROJECT_STAGES, "lbl_projectStage", "ps_"),
        f("skillsWant", "multi", "domains", "lbl_skills_porteur", "", { max: 3 }),
      ],
      rejoindre: [
        f("skillsOffer", "multi", "domains", "lbl_skills_rejoindre", "", { max: 3 }),
        f("projectDomain", "single", "domains", "lbl_pd_rejoindre", ""),
        f("projectCommit", "single", PROJECT_COMMIT, "lbl_projectCommit", "pc_"),
      ],
      transmettre: [
        f("skillsOffer", "multi", "domains", "lbl_skills_transmettre", "", { max: 3 }),
        f("learnFormat", "single", LEARN_FORMATS, "lbl_learnFormat", "lf_"),
      ],
      apprendre: [
        f("skillsWant", "multi", "domains", "lbl_skills_apprendre", "", { max: 3 }),
        f("learnFormat", "single", LEARN_FORMATS, "lbl_learnFormat", "lf_"),
      ],
    },
  },
};

/** Champs à afficher pour un univers, selon l'objectif déjà choisi (triés par groupe si le formulaire en définit). */
export function fieldsFor(universe: string, data: UniverseData): FieldSpec[] {
  const form = UNIVERSE_FORMS[universe];
  if (!form) return [];
  const goal = form.goal ? (data[form.goal.field] as string | undefined) : undefined;
  const list = [...form.common, ...(goal ? (form.byGoal[goal] ?? []) : [])];
  if (!form.groups) return list;
  // Les champs sans groupe héritent du précédent, puis tri stable par ordre des groupes.
  let current = form.groups[0];
  const tagged = list.map((spec, i) => {
    if (spec.group) current = spec.group;
    return { spec: spec.group ? spec : { ...spec, group: current }, i };
  });
  const rank = (g?: string) => Math.max(0, form.groups!.indexOf(g ?? form.groups![0]));
  return tagged.sort((x, y) => rank(x.spec.group) - rank(y.spec.group) || x.i - y.i).map((t) => t.spec);
}

/** Filtre « profil recherché » de la découverte : on filtre sur l'objectif/rôle de l'autre personne. */
export const UNIVERSE_FACETS: Record<
  string,
  { field: keyof UniverseData; label: string; options: readonly string[]; prefix: string }
> = {
  professionnel: { field: "proGoal", label: "lbl_facet_professionnel", options: PRO_GOALS, prefix: "fc_" },
  amitie: { field: "interests", label: "lbl_interests", options: INTERESTS, prefix: "int_" },
  voyage: { field: "travelGoal", label: "lbl_facet_voyage", options: TRAVEL_GOALS, prefix: "fc_" },
  projets: { field: "projectRole", label: "lbl_facet_projets", options: PROJECT_ROLES, prefix: "fc_" },
};

/* ------------------------------------------------------------------ */
/* Nettoyage serveur                                                    */
/* ------------------------------------------------------------------ */

export type MatchSubject = {
  country: string;
  city: string;
  ageBand: string;
  languages: string[];
  proDomain: string | null;
  loveLanguage: string | null;
  weekendStyle: string | null;
  universeData: UniverseData;
  heightCm?: number | null;
  gender?: string;
};
export type UniverseMatch = { score: number; reasons: string[] };

const uniq = (arr: string[]) => Array.from(new Set(arr));

/** Texte libre : sans lien, e-mail ni numéro de téléphone (anti-arnaque), longueur bornée. */
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

/**
 * Nettoie les données d'univers reçues du client : listes blanches, tailles
 * max, et — c'est l'adaptatif — seuls les champs applicables à l'objectif
 * choisi sont conservés (changer d'objectif efface les réponses devenues sans objet).
 */
export function sanitizeUniverseData(
  raw: unknown,
  opts: { domains: readonly string[]; countries: readonly string[]; universes?: readonly string[] },
): UniverseData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const universes = opts.universes ?? Object.keys(UNIVERSE_FORMS);
  for (const u of universes) {
    const form = UNIVERSE_FORMS[u];
    if (!form) continue;
    let goal: string | undefined;
    if (form.goal) {
      const g = r[form.goal.field];
      if (typeof g === "string" && form.goal.options.includes(g)) {
        goal = g;
        out[form.goal.field] = g;
      }
    }
    const specs = [...form.common, ...(goal ? (form.byGoal[goal] ?? []) : [])];
    for (const spec of specs) {
      const allowed =
        spec.source === "domains" ? opts.domains : spec.source === "countries" ? opts.countries : spec.source;
      const v = r[spec.key];
      if (spec.kind === "int") {
        const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
        const [lo, hi] = spec.range ?? [0, 999];
        if (Number.isInteger(n) && n >= lo && n <= hi) out[spec.key] = n;
      } else if (spec.kind === "text") {
        const t = cleanText(v, spec.max ?? 200);
        if (t) out[spec.key] = t;
      } else if (spec.kind === "single") {
        if (typeof v === "string" && allowed.includes(v)) out[spec.key] = v;
      } else if (Array.isArray(v)) {
        const list = uniq(v.filter((x): x is string => typeof x === "string" && allowed.includes(x))).slice(
          0,
          spec.max ?? 6,
        );
        if (list.length) out[spec.key] = list;
      }
    }
  }
  const d = out as UniverseData;
  if (d.partnerAgeMin && d.partnerAgeMax && d.partnerAgeMin > d.partnerAgeMax)
    [d.partnerAgeMin, d.partnerAgeMax] = [d.partnerAgeMax, d.partnerAgeMin];
  return d;
}

/** Lecture tolérante de la colonne jsonb (objet, chaîne JSON ou null). */
export function parseUniverseData(raw: unknown): UniverseData {
  if (typeof raw === "string") {
    try {
      return parseUniverseData(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  return raw && typeof raw === "object" ? (raw as UniverseData) : {};
}

/* ------------------------------------------------------------------ */
/* Appariement                                                          */
/* ------------------------------------------------------------------ */

const inter = (a: string[] = [], b: string[] = []) => a.filter((x) => b.includes(x));
const clamp = (n: number) => Math.max(24, Math.min(98, Math.round(n)));
const sharedLang = (a: MatchSubject, b: MatchSubject) => inter(a.languages, b.languages).length > 0;
const ageGap = (a: string, b: string) => {
  const n = (x: string) => parseInt(x, 10) || 0;
  return Math.abs(n(a) - n(b));
};

/** Score (24–98) et raisons (clés i18n `r_*`) d'une paire pour un univers donné. */
export function scoreUniverse(universe: string, me: MatchSubject, them: MatchSubject): UniverseMatch {
  const reasons: string[] = [];
  let score = 40;
  const a = me.universeData ?? {};
  const b = them.universeData ?? {};

  switch (universe) {
    case "professionnel": {
      const comp = Boolean(a.proGoal && b.proGoal && PRO_GOAL_COMPLEMENT[a.proGoal] === b.proGoal);
      if (comp) {
        score += 30;
        reasons.push("r_complement");
      }
      const dom = inter(a.focusDomains, b.focusDomains);
      if (dom.length) {
        score += (comp ? 14 : 6) + (dom.length > 1 && comp ? 4 : 0);
        reasons.push("r_sameDomain");
      } else if (!a.focusDomains && !b.focusDomains && me.proDomain && me.proDomain === them.proDomain) {
        score += 8;
        reasons.push("r_sameDomain");
      }
      if (comp && (a.proGoal === "recrute" || a.proGoal === "emploi") && inter(a.contractTypes, b.contractTypes).length) {
        score += 8;
        reasons.push("r_contract");
      }
      if (comp && a.proGoal === "associe" && a.proStage && a.proStage === b.proStage) {
        score += 6;
        reasons.push("r_sameStage");
      }
      if (comp && a.proGoal === "affaires" && a.bizSide && BIZ_COMPLEMENT[a.bizSide] === b.bizSide) score += 10;
      if (inter(a.meetFormat, b.meetFormat).length) {
        score += 4;
        reasons.push("r_format");
      }
      if (me.country === them.country) score += 6;
      if (me.city && me.city === them.city) score += 4;
      if (sharedLang(me, them)) score += 4;
      break;
    }
    case "amitie": {
      const common = inter(a.interests, b.interests);
      const total = new Set([...(a.interests ?? []), ...(b.interests ?? [])]).size;
      if (common.length) {
        score += Math.round((common.length / Math.max(total, 1)) * 30) + 6;
        reasons.push("r_sharedInterests");
      }
      if (a.friendGoal && a.friendGoal === b.friendGoal) {
        score += 8;
        reasons.push("r_sameGoal");
        if (a.communityType && a.communityType === b.communityType) {
          score += 10;
          reasons.push("r_community");
        }
        if (inter(a.availability, b.availability).length) {
          score += 6;
          reasons.push("r_availability");
        }
        if (a.groupFormat && a.groupFormat === b.groupFormat) score += 6;
      }
      if (a.socialVibe && a.socialVibe === b.socialVibe) score += 5;
      if (me.city && me.city === them.city) {
        score += 10;
        reasons.push("r_sameCity");
      } else if (me.country === them.country) score += 6;
      if (sharedLang(me, them)) score += 6;
      if (ageGap(me.ageBand, them.ageBand) <= 10) score += 6;
      break;
    }
    case "voyage": {
      const ga = a.travelGoal;
      const gb = b.travelGoal;
      const guideComp =
        (ga === "chercher_guide" && gb === "guide") || (ga === "guide" && gb === "chercher_guide");
      const dest = inter(a.travelDestinations, b.travelDestinations);
      if (guideComp) {
        if (dest.length) {
          score += 34;
          reasons.push("r_guide", "r_destinations");
        } else score += 4;
        if (inter(a.travelStyles, b.travelStyles).length) score += 6;
      } else if ((!ga || ga === "compagnon") && (!gb || gb === "compagnon")) {
        const styles = inter(a.travelStyles, b.travelStyles);
        if (styles.length) {
          score += Math.min(24, styles.length * 8);
          reasons.push("r_travelStyle");
        }
        if (dest.length) {
          score += Math.min(20, dest.length * 10);
          reasons.push("r_destinations");
        }
        if (a.travelWhen && b.travelWhen) {
          if (a.travelWhen === b.travelWhen) {
            score += 8;
            reasons.push("r_timing");
          } else if (a.travelWhen === "flex" || b.travelWhen === "flex") score += 4;
        }
        if (a.tripDuration && a.tripDuration === b.tripDuration) {
          score += 6;
          reasons.push("r_duration");
        }
        if (a.travelBudget && a.travelBudget === b.travelBudget) {
          score += 6;
          reasons.push("r_budget");
        }
      } else if (inter(a.travelStyles, b.travelStyles).length) score += 4;
      if (sharedLang(me, them)) score += 4;
      break;
    }
    case "projets": {
      const rel = a.projectRole ? PROJECT_ROLE_COMPLEMENT[a.projectRole] : undefined;
      let best = false;
      if (rel && b.projectRole) {
        if (rel.best.includes(b.projectRole)) {
          best = true;
          score += 26;
          reasons.push("r_complement");
        } else if (rel.partial.includes(b.projectRole)) score += 12;
      }
      const cross = inter(a.skillsOffer, b.skillsWant).length + inter(a.skillsWant, b.skillsOffer).length;
      if (cross) {
        score += Math.min(24, cross * 8);
        reasons.push("r_skills");
      }
      if (a.projectCause && a.projectCause === b.projectCause) {
        score += 8;
        reasons.push("r_sameCause");
      }
      if (a.projectDomain && a.projectDomain === b.projectDomain) {
        score += 8;
        reasons.push("r_sameDomain");
      }
      if (best && a.learnFormat && a.learnFormat === b.learnFormat) {
        score += 6;
        reasons.push("r_format");
      }
      if (sharedLang(me, them)) score += 4;
      break;
    }
    default:
      return loveReasons(me, them);
  }
  return { score: clamp(score), reasons: reasons.slice(0, 3) };
}

/** La tranche d'âge (« 30-34 », « 50+ ») recoupe-t-elle la fourchette souhaitée ? */
function bandFits(min: number | undefined, max: number | undefined, band: string): boolean {
  if (min === undefined && max === undefined) return true;
  const m = band.match(/^(\d+)(?:-(\d+)|\+)$/);
  if (!m) return true;
  const lo = Number(m[1]);
  const hi = m[2] ? Number(m[2]) : 99;
  return hi >= (min ?? 0) && lo <= (max ?? 99);
}

/**
 * Love — incompatibilités RÉDHIBITOIRES déclarées par les membres eux-mêmes
 * (le profil est alors masqué plutôt que mal classé) :
 *  - polygamie : « non » face à « oui » ;
 *  - religion « essentielle » : l'un des deux l'exige identique et elle diffère.
 */
export function loveDealbreaker(me: MatchSubject, them: MatchSubject): boolean {
  const a = me.universeData ?? {};
  const b = them.universeData ?? {};
  if ((a.polygamy === "non" && b.polygamy === "oui") || (a.polygamy === "oui" && b.polygamy === "non")) return true;
  if (a.religion && b.religion && a.religion !== b.religion) {
    if (a.religionImportance === "essentiel" || b.religionImportance === "essentiel") return true;
  }
  return false;
}

/** Travel — cercle réservé aux femmes : l'un des deux le demande, l'autre n'est pas une femme. */
export function travelIncompatible(me: MatchSubject, them: MatchSubject): boolean {
  const wantsWomen = (d?: UniverseData) => d?.companionGender === "femmes";
  if (wantsWomen(me.universeData) && them.gender && them.gender !== "femme") return true;
  if (wantsWomen(them.universeData) && me.gender && me.gender !== "femme") return true;
  return false;
}

/**
 * Love : le score de base (âge, pays, langues, valeurs) vient de
 * `compatibilityScore` ; ici un bonus/malus (`score`, de −40 à +30) et les raisons.
 */
export function loveReasons(me: MatchSubject, them: MatchSubject): UniverseMatch {
  const a = me.universeData ?? {};
  const b = them.universeData ?? {};
  const reasons: string[] = [];
  let bonus = 0;

  // Foi
  if (a.religion && b.religion) {
    if (a.religion === b.religion) {
      bonus += 10;
      reasons.push("r_sameFaith");
      if (a.faithPractice && a.faithPractice === b.faithPractice) bonus += 4;
    } else if (CHRISTIAN.includes(a.religion) && CHRISTIAN.includes(b.religion)) {
      bonus += 5;
      reasons.push("r_sameFaith");
    } else if (a.religionImportance === "souhaite" || b.religionImportance === "souhaite") bonus -= 6;
  }
  // Vie de couple
  if (a.polygamy === "non" && b.polygamy === "non") {
    bonus += 6;
    reasons.push("r_coupleValues");
  }
  if (a.wantsChildren && b.wantsChildren) {
    if ((a.wantsChildren === "yes" && b.wantsChildren === "no") || (a.wantsChildren === "no" && b.wantsChildren === "yes")) bonus -= 15;
    else if (a.wantsChildren === b.wantsChildren) {
      bonus += 4;
      reasons.push("r_family");
    }
  }
  // Projet
  if (a.loveGoal && a.loveGoal === b.loveGoal) bonus += 4;
  if (a.loveHorizon && a.loveHorizon === b.loveHorizon) {
    bonus += 6;
    reasons.push("r_horizon");
  }
  // Fourchettes d'âge et de taille souhaitées (souples)
  const hasAge = a.partnerAgeMin !== undefined || a.partnerAgeMax !== undefined;
  if (hasAge) {
    if (bandFits(a.partnerAgeMin, a.partnerAgeMax, them.ageBand)) {
      bonus += 6;
      reasons.push("r_ageRange");
    } else bonus -= 12;
  }
  if ((b.partnerAgeMin !== undefined || b.partnerAgeMax !== undefined) && !bandFits(b.partnerAgeMin, b.partnerAgeMax, me.ageBand)) bonus -= 8;
  if (a.partnerMinHeight && them.heightCm && them.heightCm < a.partnerMinHeight) bonus -= 8;
  if (b.partnerMinHeight && me.heightCm && me.heightCm < b.partnerMinHeight) bonus -= 5;
  // Valeurs recherchées / proposées, centres d'intérêt
  const vals = inter(a.partnerValues, b.values).length + inter(b.partnerValues, a.values).length;
  if (vals) {
    bonus += Math.min(12, vals * 4);
    reasons.push("r_values");
  }
  const ints = inter(a.interests, b.interests).length;
  if (ints) {
    bonus += Math.min(9, ints * 3);
    reasons.push("r_sharedInterests");
  }
  // Affinités de base (déjà comptées dans compatibilityScore) : raisons seulement
  if (me.loveLanguage && me.loveLanguage === them.loveLanguage) reasons.push("r_loveLang");
  if (me.weekendStyle && me.weekendStyle === them.weekendStyle) reasons.push("r_weekend");
  if (me.city && me.city === them.city) reasons.push("r_sameCity");
  if (sharedLang(me, them)) reasons.push("r_sharedLang");
  return { score: Math.max(-40, Math.min(30, bonus)), reasons: reasons.slice(0, 3) };
}
