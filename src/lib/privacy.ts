/**
 * Vie privée — logique pure (sans dépendance), testée par scripts/safety.test.mjs.
 */

export function ageFromBirthDate(iso: string, now: Date = new Date()): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return -1;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return -1;
  let age = now.getUTCFullYear() - y;
  const md = now.getUTCMonth() - (m - 1);
  if (md < 0 || (md === 0 && now.getUTCDate() < d)) age -= 1;
  return age;
}

export function ageBandFromBirthDate(iso: string, now: Date = new Date()): string {
  const age = ageFromBirthDate(iso, now);
  if (age <= 24) return "18-24";
  if (age <= 29) return "25-29";
  if (age <= 34) return "30-34";
  if (age <= 39) return "35-39";
  if (age <= 49) return "40-49";
  return "50+";
}

export function stripPrivateIdentity<T extends { phone: string | null; birthDate?: string | null }>(p: T): T {
  return { ...p, birthDate: null, phone: null };
}
