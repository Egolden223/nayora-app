/** Indicatifs pays courants (Afrique, Europe, Amérique) pour l'auth téléphone. */
export type DialCode = { iso: string; dial: string; label: string };

export const DIAL_CODES: DialCode[] = [
  { iso: "CI", dial: "+225", label: "Côte d'Ivoire (+225)" },
  { iso: "SN", dial: "+221", label: "Sénégal (+221)" },
  { iso: "ML", dial: "+223", label: "Mali (+223)" },
  { iso: "BF", dial: "+226", label: "Burkina Faso (+226)" },
  { iso: "NE", dial: "+227", label: "Niger (+227)" },
  { iso: "TG", dial: "+228", label: "Togo (+228)" },
  { iso: "BJ", dial: "+229", label: "Bénin (+229)" },
  { iso: "GN", dial: "+224", label: "Guinée (+224)" },
  { iso: "CM", dial: "+237", label: "Cameroun (+237)" },
  { iso: "GA", dial: "+241", label: "Gabon (+241)" },
  { iso: "CG", dial: "+242", label: "Congo (+242)" },
  { iso: "CD", dial: "+243", label: "RDC (+243)" },
  { iso: "FR", dial: "+33", label: "France (+33)" },
  { iso: "BE", dial: "+32", label: "Belgique (+32)" },
  { iso: "CH", dial: "+41", label: "Suisse (+41)" },
  { iso: "CA", dial: "+1", label: "Canada (+1)" },
  { iso: "US", dial: "+1", label: "États-Unis (+1)" },
  { iso: "GB", dial: "+44", label: "Royaume-Uni (+44)" },
  { iso: "MA", dial: "+212", label: "Maroc (+212)" },
  { iso: "DZ", dial: "+213", label: "Algérie (+213)" },
  { iso: "TN", dial: "+216", label: "Tunisie (+216)" },
  { iso: "NG", dial: "+234", label: "Nigeria (+234)" },
  { iso: "GH", dial: "+233", label: "Ghana (+233)" },
  { iso: "KE", dial: "+254", label: "Kenya (+254)" },
  { iso: "PT", dial: "+351", label: "Portugal (+351)" },
  { iso: "ES", dial: "+34", label: "Espagne (+34)" },
  { iso: "DE", dial: "+49", label: "Allemagne (+49)" },
  { iso: "IT", dial: "+39", label: "Italie (+39)" },
];

const PHONE_EMAIL_DOMAIN = "phone.nayora.app";

/** Normalise en E.164 approximatif (digits only with leading +). */
export function toE164(dial: string, national: string): string | null {
  const d = dial.replace(/[^\d+]/g, "");
  let n = national.replace(/[^\d]/g, "");
  // drop leading 0 on national numbers (common in FR / Africa)
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length < 6 || n.length > 15) return null;
  const full = `${d.startsWith("+") ? d : `+${d}`}${n}`;
  if (!/^\+\d{8,16}$/.test(full)) return null;
  return full;
}

/** Email technique pour Better Auth (pas d'SMS requis). */
export function phoneToAuthEmail(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  return `${digits}@${PHONE_EMAIL_DOMAIN}`;
}

export function isPhoneAuthEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${PHONE_EMAIL_DOMAIN}`);
}

export const PENDING_PHONE_KEY = "nayora_pending_phone";
