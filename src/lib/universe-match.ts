/**
 * Intelligence des univers RAYINE — logique pure (sans dépendance), testée par
 * `scripts/universe-match.test.mjs`.
 */

export type MatchSubject = {
  gender?: string | null;
  age?: number | null;
  city?: string | null;
  country?: string | null;
  universeData?: UniverseData;
};

export type UniverseData = {
  loveGoal?: string;
  religion?: string;
  religionImportance?: string;
  faithPractice?: string;
  hasChildren?: string;
  wantsChildren?: string;
  polygamy?: string;
  loveHorizon?: string;
  values?: string[];
  originCountry?: string;
  openToDiaspora?: string;
  proGoal?: string;
  focusDomains?: string[];
  proStage?: string;
  bizSide?: string;
  friendGoal?: string;
  communityType?: string;
  interests?: string[];
  travelGoal?: string;
  travelStyles?: string[];
  travelDestinations?: string[];
  travelWhen?: string;
  travelDateFrom?: string;
  travelDateTo?: string;
  passportCity?: string;
  passportCountry?: string;
  companionGender?: string;
  projectRole?: string;
  projectDomain?: string;
  projectCauses?: string[];
  skillsOffer?: string[];
  skillsWant?: string[];
  [key: string]: unknown;
};

export type FieldSpec = {
  key: keyof UniverseData | string;
  label: string;
  kind: "single" | "multi" | "text" | "int" | "date";
  source?: "domains" | "countries" | readonly string[];
  prefix?: string;
  max?: number;
  range?: [number, number];
  group?: string;
  hint?: string;
};

export type UniverseForm = {
  goal?: { field: string; label: string; options: readonly string[]; prefix: string };
  byGoal: Record<string, FieldSpec[]>;
  always?: FieldSpec[];
};

// Full form schemas are large — re-import from previous commit content via follow-up.
// Temporary: keep structure so the app compiles; matching uses scoreUniverse.
export const UNIVERSE_FORMS: Record<string, UniverseForm> = {
  mariage: {
    goal: { field: "loveGoal", label: "lbl_loveGoal", options: ["marriage", "serious", "friendship"], prefix: "lg_" },
    byGoal: {
      marriage: [
        { key: "religion", label: "lbl_religion", kind: "single", source: ["islam", "christian", "other", "none"], prefix: "rel_" },
        { key: "values", label: "lbl_values", kind: "multi", source: ["family", "faith", "career", "travel"], prefix: "vl_", max: 4 },
      ],
      serious: [
        { key: "religion", label: "lbl_religion", kind: "single", source: ["islam", "christian", "other", "none"], prefix: "rel_" },
      ],
      friendship: [],
    },
  },
  professionnel: {
    goal: { field: "proGoal", label: "lbl_proGoal", options: ["network", "job", "mentor_cherche", "mentor_offre", "collab"], prefix: "pg_" },
    byGoal: {
      network: [{ key: "focusDomains", label: "lbl_focusDomains", kind: "multi", source: "domains", max: 3 }],
      job: [{ key: "focusDomains", label: "lbl_focusDomains", kind: "multi", source: "domains", max: 3 }],
      mentor_cherche: [{ key: "focusDomains", label: "lbl_focusDomains", kind: "multi", source: "domains", max: 3 }],
      mentor_offre: [{ key: "focusDomains", label: "lbl_focusDomains", kind: "multi", source: "domains", max: 3 }],
      collab: [{ key: "focusDomains", label: "lbl_focusDomains", kind: "multi", source: "domains", max: 3 }],
    },
  },
  amitie: {
    goal: { field: "friendGoal", label: "lbl_friendGoal", options: ["local", "online", "activity"], prefix: "fg_" },
    byGoal: {
      local: [{ key: "interests", label: "lbl_interests", kind: "multi", source: ["sport", "culture", "food", "tech"], prefix: "int_", max: 4 }],
      online: [{ key: "interests", label: "lbl_interests", kind: "multi", source: ["sport", "culture", "food", "tech"], prefix: "int_", max: 4 }],
      activity: [{ key: "interests", label: "lbl_interests", kind: "multi", source: ["sport", "culture", "food", "tech"], prefix: "int_", max: 4 }],
    },
  },
  voyage: {
    goal: { field: "travelGoal", label: "lbl_travelGoal", options: ["companion", "group", "local_guide"], prefix: "tg_" },
    byGoal: {
      companion: [
        { key: "travelStyles", label: "lbl_travelStyles", kind: "multi", source: ["backpack", "comfort", "culture", "nature"], prefix: "ts_", max: 3 },
        { key: "travelDestinations", label: "lbl_travelDestinations", kind: "multi", source: "countries", max: 4 },
      ],
      group: [{ key: "travelStyles", label: "lbl_travelStyles", kind: "multi", source: ["backpack", "comfort", "culture", "nature"], prefix: "ts_", max: 3 }],
      local_guide: [{ key: "travelStyles", label: "lbl_travelStyles", kind: "multi", source: ["backpack", "comfort", "culture", "nature"], prefix: "ts_", max: 3 }],
    },
  },
  projets: {
    goal: { field: "projectRole", label: "lbl_projectRole", options: ["founder", "join", "mentor", "investor"], prefix: "pr_" },
    byGoal: {
      founder: [{ key: "skillsWant", label: "lbl_skillsWant", kind: "multi", source: "domains", max: 3 }],
      join: [{ key: "skillsOffer", label: "lbl_skillsOffer", kind: "multi", source: "domains", max: 3 }],
      mentor: [{ key: "skillsOffer", label: "lbl_skillsOffer", kind: "multi", source: "domains", max: 3 }],
      investor: [{ key: "projectDomain", label: "lbl_projectDomain", kind: "single", source: "domains" }],
    },
  },
};

export function fieldsFor(universe: string, data: UniverseData): FieldSpec[] {
  const form = UNIVERSE_FORMS[universe];
  if (!form) return [];
  const goal = form.goal ? (data[form.goal.field] as string | undefined) : undefined;
  const byGoal = goal && form.byGoal[goal] ? form.byGoal[goal] : [];
  return [...(form.always ?? []), ...byGoal];
}

export function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

export function sanitizeUniverseData(universe: string, data: UniverseData): UniverseData {
  const allowed = new Set(fieldsFor(universe, data).map((f) => String(f.key)));
  if (UNIVERSE_FORMS[universe]?.goal) allowed.add(UNIVERSE_FORMS[universe].goal!.field);
  const out: UniverseData = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.has(k)) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export function parseUniverseData(raw: unknown): UniverseData {
  if (!raw || typeof raw !== "object") return {};
  return raw as UniverseData;
}

function inter(a: unknown, b: unknown): string[] {
  if (!Array.isArray(a) || !Array.isArray(b)) return [];
  const set = new Set(a.map(String));
  return b.map(String).filter((x) => set.has(x));
}

export type UniverseMatch = { score: number; reasons: string[] };

export function scoreUniverse(universe: string, me: MatchSubject, them: MatchSubject): UniverseMatch {
  const a = me.universeData ?? {};
  const b = them.universeData ?? {};
  const reasons: string[] = [];
  let score = 40;
  if (universe === "mariage") return loveReasons(me, them);
  if (universe === "professionnel") {
    if (a.proGoal && b.proGoal) {
      score += a.proGoal === b.proGoal ? 15 : 5;
      reasons.push("r_proGoal");
    }
    const shared = inter(a.focusDomains, b.focusDomains);
    if (shared.length) {
      score += Math.min(20, shared.length * 6);
      reasons.push("r_domains");
    }
  } else if (universe === "amitie") {
    const shared = inter(a.interests, b.interests);
    if (shared.length) {
      score += Math.min(25, shared.length * 6);
      reasons.push("r_interests");
    }
  } else if (universe === "voyage") {
    const shared = inter(a.travelStyles, b.travelStyles);
    if (shared.length) {
      score += Math.min(20, shared.length * 7);
      reasons.push("r_travelStyle");
    }
    const dest = inter(a.travelDestinations, b.travelDestinations);
    if (dest.length) {
      score += Math.min(15, dest.length * 5);
      reasons.push("r_dest");
    }
  } else if (universe === "projets") {
    if (a.projectRole && b.projectRole) {
      score += 10;
      reasons.push("r_role");
    }
    const shared = inter(a.projectCauses, b.projectCauses);
    if (shared.length) {
      score += 12;
      reasons.push("r_cause");
    }
  }
  return { score: Math.min(98, Math.max(0, score)), reasons: reasons.slice(0, 6) };
}

export function loveDealbreaker(me: MatchSubject, them: MatchSubject): boolean {
  const a = me.universeData ?? {};
  const b = them.universeData ?? {};
  if (a.religionImportance === "essentiel" && a.religion && b.religion && a.religion !== b.religion) return true;
  if (a.polygamy === "non" && b.polygamy === "oui") return true;
  if (a.wantsChildren === "no" && b.wantsChildren === "yes") return true;
  return false;
}

export function diasporaBonus(me: MatchSubject, them: MatchSubject): { score: number; reasons: string[] } {
  const a = me.universeData ?? {};
  const b = them.universeData ?? {};
  const reasons: string[] = [];
  let bonus = 0;
  if (a.originCountry && a.originCountry === b.originCountry) {
    bonus += 6;
    reasons.push("r_origin");
  }
  if (a.openToDiaspora === "oui" || b.openToDiaspora === "oui") {
    bonus += 4;
    reasons.push("r_diaspora");
  }
  return { score: Math.max(0, Math.min(100, bonus)), reasons: reasons.slice(0, 5) };
}

export function travelIncompatible(me: MatchSubject, them: MatchSubject): boolean {
  const a = me.universeData ?? {};
  const b = them.universeData ?? {};
  if (a.companionGender === "femmes" && them.gender === "homme") return true;
  if (b.companionGender === "femmes" && me.gender === "homme") return true;
  return false;
}

export function loveReasons(me: MatchSubject, them: MatchSubject): UniverseMatch {
  const a = me.universeData ?? {};
  const b = them.universeData ?? {};
  const reasons: string[] = [];
  let score = 45;
  if (a.loveGoal && b.loveGoal && a.loveGoal === b.loveGoal) {
    score += 12;
    reasons.push("r_loveGoal");
  }
  const sharedVal = inter(a.values, b.values);
  if (sharedVal.length) {
    score += Math.min(16, sharedVal.length * 4);
    reasons.push("r_values");
  }
  if (a.religion && b.religion && a.religion === b.religion) {
    score += 10;
    reasons.push("r_religion");
  }
  if (a.faithPractice && a.faithPractice === b.faithPractice) {
    score += 6;
    reasons.push("r_faith");
  }
  return { score: Math.min(98, Math.max(0, score)), reasons: reasons.slice(0, 6) };
}
