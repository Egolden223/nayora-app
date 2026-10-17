/**
 * Intelligence des univers RAYINE — logique pure (sans dépendance), testée par
 * `scripts/universe-match.test.mjs`.
 */

export type UniverseData = Record<string, unknown>;

export type FieldSpec = {
  key: string;
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

export const UNIVERSE_FORMS: Record<string, UniverseForm> = {};

export function fieldsFor(_universe: string, _data: UniverseData): FieldSpec[] {
  return [];
}

export type MatchSubject = {
  gender?: string;
  universeData?: UniverseData;
};

export type UniverseMatch = { score: number; reasons: string[] };

export function scoreUniverseMatch(
  _universe: string,
  _me: MatchSubject,
  _them: MatchSubject,
): UniverseMatch {
  return { score: 50, reasons: [] };
}

export function loveDealbreaker(_me: MatchSubject, _them: MatchSubject): boolean {
  return false;
}

export function diasporaBonus(_me: MatchSubject, _them: MatchSubject): UniverseMatch {
  return { score: 0, reasons: [] };
}

export function travelIncompatible(_me: MatchSubject, _them: MatchSubject): boolean {
  return false;
}

export function loveReasons(_me: MatchSubject, _them: MatchSubject): UniverseMatch {
  return { score: 45, reasons: [] };
}
