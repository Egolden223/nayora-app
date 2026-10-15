/**
 * Pays du monde (ISO 3166-1 alpha-2) proposés dans le sélecteur "pays" —
 * l'app s'adresse à tous les pays, pas seulement à ceux qui ont une devise
 * dédiée ci-dessous. Les noms affichés viennent de `countryName()`
 * (Intl.DisplayNames), donc aucune traduction à maintenir ici.
 */
export const COUNTRY_CODES = [
  // Afrique
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD",
  "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE",
  "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG",
  "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG",
  "ZM", "ZW",
  // Amériques
  "AG", "AR", "BS", "BB", "BZ", "BO", "BR", "CA", "CL", "CO", "CR", "CU", "DM",
  "DO", "EC", "SV", "GD", "GT", "GY", "HT", "HN", "JM", "MX", "NI", "PA", "PY",
  "PE", "KN", "LC", "VC", "SR", "TT", "US", "UY", "VE",
  // Asie
  "AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "CY", "GE", "IN", "ID",
  "IR", "IQ", "IL", "JP", "JO", "KZ", "KW", "KG", "LA", "LB", "MY", "MV", "MN",
  "MM", "NP", "KP", "OM", "PK", "PS", "PH", "QA", "SA", "SG", "KR", "LK", "SY",
  "TW", "TJ", "TH", "TL", "TR", "TM", "AE", "UZ", "VN", "YE",
  // Europe
  "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IS", "IE", "IT", "XK", "LV", "LI", "LT", "LU", "MT", "MD",
  "MC", "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI",
  "ES", "SE", "CH", "UA", "GB", "VA",
  // Océanie
  "AU", "FJ", "KI", "MH", "FM", "NR", "NZ", "PW", "PG", "WS", "SB", "TO", "TV",
  "VU",
] as const;

/**
 * Nombre de conversations ouvertes en compte gratuit.
 */
export const FREE_CHAT_LIMIT = 15;

/** Anti-abus : likes max par heure et par compte. */
export const LIKE_LIMIT_PER_HOUR = 40;

/**
 * Délai de confiance avant de partager un numéro ou de demander le contact.
 * Love (rencontres sentimentales) : le plus exposé aux arnaques → 72 h et 4 messages.
 * Friends / Pro / Travel / Projects : 24 h et 2 messages (l'échange de coordonnées y est
 * souvent légitime et rapide, et la visio intégrée existe déjà).
 */
export const CONTACT_MIN_HOURS = 72;
export const CONTACT_MIN_MESSAGES = 4;
export const CONTACT_MIN_HOURS_OTHER = 24;
export const CONTACT_MIN_MESSAGES_OTHER = 2;
/** Alias historique : partage de numéro dans le chat (règle Love). */
export const PHONE_SHARE_MIN_HOURS = CONTACT_MIN_HOURS;

/** Règle de confiance applicable à une paire : stricte dès qu'ils partagent l'univers Love. */
export function trustRules(
  meUniverses: readonly string[],
  partnerUniverses: readonly string[],
): { hours: number; minMessages: number; strict: boolean } {
  const strict = meUniverses.includes("mariage") && partnerUniverses.includes("mariage");
  return strict
    ? { hours: CONTACT_MIN_HOURS, minMessages: CONTACT_MIN_MESSAGES, strict: true }
    : { hours: CONTACT_MIN_HOURS_OTHER, minMessages: CONTACT_MIN_MESSAGES_OTHER, strict: false };
}

/** Âge minimum légal pour s'inscrire (ans révolus). */
export const MIN_AGE_YEARS = 18;

/**
 * Prix de base Prestige (XOF).
 * Affiché localisé via formatPrice() pour les pays de PRICING_TABLE ;
 * les autres pays voient le prix en USD par défaut.
 * Pendant le lancement le paiement est désactivé (activation gratuite).
 *
 * Les taux ci-dessous sont indicatifs (affichage uniquement) — à rebrancher
 * sur un fournisseur de taux de change réel avant d'activer un vrai paiement.
 */
export const BASE_PRICE_XOF = 5000;

export const AGE_BANDS = ["18-24", "25-29", "30-34", "35-39", "40-49", "50+"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const GENDERS = ["femme", "homme", "autre"] as const;
export type Gender = (typeof GENDERS)[number];

export const LOOKING_FOR = ["femme", "homme", "tous"] as const;
export type LookingFor = (typeof LOOKING_FOR)[number];

export const FAMILY_STATUSES = [
  "celibataire",
  "divorce",
  "veuf",
  "separe",
] as const;
export type FamilyStatus = (typeof FAMILY_STATUSES)[number];

/**
 * Univers NAYORA. Les clés historiques (colonne `intention`) sont conservées
 * pour la compatibilité des données :
 *   mariage → NAYORA Love · amitie → NAYORA Friends · professionnel → NAYORA Pro
 *   voyage → NAYORA Travel & Adventure · projets → NAYORA Projects & Learn
 */
export const INTENTIONS = [
  "mariage",
  "amitie",
  "professionnel",
  "voyage",
  "projets",
] as const;
export type Intention = (typeof INTENTIONS)[number];
export const UNIVERSES = INTENTIONS;
export type Universe = Intention;

/** Univers qui demandent un domaine d'activité (réseau pro, projets). */
export const UNIVERSES_WITH_DOMAIN: readonly string[] = ["professionnel", "projets"];

/** Parse la colonne `universes` (liste séparée par des virgules), repli sur `intention`. */
export function parseUniverses(raw: string | null | undefined, intention: string): Universe[] {
  const list = (raw ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is Universe => (INTENTIONS as readonly string[]).includes(x));
  if (list.length) return Array.from(new Set(list));
  return (INTENTIONS as readonly string[]).includes(intention) ? [intention as Universe] : ["mariage"];
}

/**
 * Arnaques sans ambiguïté (moyens de paiement typiques des escrocs, ou demande d'argent
 * explicite) — l'envoi du message est BLOQUÉ.
 */
export const SCAM_HARD_PATTERN =
  /western\s*union|moneygram|money\s?gram|ria\s*money|carte\s?cadeau|gift\s?card|itunes\s*card|google\s*play\s*card|virement\s*urgent|envoie[- ]moi\s*(de\s*)?l['\u2019]argent|send\s*me\s*money|wire\s*(me\s*)?money|i\s*need\s*money|urgent\s*transfer|paypal\s*me|cashapp|venmo/i;

/**
 * Termes ambigus : légitimes entre professionnels (fintech, financement, projets), suspects
 * dans une conversation sentimentale. On ne bloque pas : rappel de prudence avant l'envoi
 * (client) et message signalé aux modérateurs (serveur).
 */
export const SCAM_SOFT_PATTERN =
  /usdt|bitcoin|\bbtc\b|crypto|besoin\s*d['\u2019]argent|j['\u2019]ai\s*besoin\s*de\s*fonds|prête?[- ]moi\s*de\s*l['\u2019]argent|lend\s*me\s*money/i;

/** Rétrocompatibilité : l'un ou l'autre. */
export const SCAM_PATTERN = new RegExp(`${SCAM_HARD_PATTERN.source}|${SCAM_SOFT_PATTERN.source}`, "i");

/**
 * Insultes grossières — bloquent l'envoi (liste courte pour limiter les faux positifs).
 */
export const ABUSE_PATTERN =
  /\b(fdp|ntm|nique\s*ta|encul[e\u00e9]|connard|salope|pute\b|pd\b|faggot|bitch|asshole|motherfucker|cunt)\b/i;

/**
 * Numéro de téléphone en clair dans le chat ? (l'envoi du numéro passe par le bouton dédié.)
 */
export function containsPhoneNumber(text: string): boolean {
  const CURRENCY = "(?:fcfa|f\\s?cfa|xof|xaf|cfa|eur|euros?|\\u20ac|usd|\\$|dollars?|mad|gnf|millions?|k\\b)";
  const cleaned = text
    .replace(/\b\d{1,2}[./-]\d{1,2}[./-](?:19|20)\d{2}\b/g, " ")
    .replace(new RegExp(`\\b\\d{1,3}(?:[ \\u00a0.,]\\d{3}){2,}(?:\\s*${CURRENCY})?`, "gi"), (m) =>
      /000$/.test(m.trim()) || new RegExp(`${CURRENCY}$`, "i").test(m) ? " " : m,
    )
    .replace(new RegExp(`\\b\\d{6,}\\s*${CURRENCY}`, "gi"), " ");
  const runs = cleaned.match(/(?:\+|00)?\d(?:[\s().-]{0,2}\d){6,}/g) ?? [];
  return runs.some((r) => r.replace(/\D/g, "").length >= 8);
}

export const PRO_DOMAINS = [
  "tech",
  "sante",
  "finance",
  "commerce",
  "agriculture",
  "droit",
  "education",
  "communication",
  "industrie_btp",
  "transport_logistique",
  "hotellerie_tourisme",
  "artisanat",
  "administration_publique",
  "art_culture",
  "ong_humanitaire",
  "autre",
] as const;
export type ProDomain = (typeof PRO_DOMAINS)[number];

export const LANGUAGE_CODES = [
  "fr", "en", "es", "pt", "ar", "zh", "hi", "bn", "ru", "de", "ja", "ko",
  "it", "nl", "tr", "fa", "ur", "vi", "th", "id", "pl", "sw", "ha", "yo",
  "am", "wo", "ig", "zu",
] as const;

export const LOVE_LANGUAGES = [
  "paroles",
  "qualite",
  "cadeaux",
  "services",
  "contact",
] as const;

export const WEEKEND_STYLES = [
  "sorties",
  "maison",
  "sport",
  "culture",
  "famille",
] as const;

/** Devises locales curées ; tout pays absent de cette table est facturé en USD. */
const PRICING_TABLE: { code: string; currency: string; symbol: string; rate: number }[] = [
  { code: "CI", currency: "XOF", symbol: "FCFA", rate: 1 },
  { code: "SN", currency: "XOF", symbol: "FCFA", rate: 1 },
  { code: "ML", currency: "XOF", symbol: "FCFA", rate: 1 },
  { code: "BF", currency: "XOF", symbol: "FCFA", rate: 1 },
  { code: "BJ", currency: "XOF", symbol: "FCFA", rate: 1 },
  { code: "TG", currency: "XOF", symbol: "FCFA", rate: 1 },
  { code: "GN", currency: "GNF", symbol: "GNF", rate: 8.5 },
  { code: "CM", currency: "XAF", symbol: "FCFA", rate: 1 },
  { code: "GA", currency: "XAF", symbol: "FCFA", rate: 1 },
  { code: "TD", currency: "XAF", symbol: "FCFA", rate: 1 },
  { code: "CG", currency: "XAF", symbol: "FCFA", rate: 1 },
  { code: "MA", currency: "MAD", symbol: "MAD", rate: 0.15 },
  { code: "TN", currency: "TND", symbol: "TND", rate: 0.0075 },
  { code: "NG", currency: "NGN", symbol: "₦", rate: 2.4 },
  { code: "GH", currency: "GHS", symbol: "GH₵", rate: 0.023 },
  { code: "KE", currency: "KES", symbol: "KSh", rate: 0.21 },
  { code: "ZA", currency: "ZAR", symbol: "R", rate: 0.03 },
  { code: "EG", currency: "EGP", symbol: "E£", rate: 0.078 },
  { code: "IN", currency: "INR", symbol: "₹", rate: 0.14 },
  { code: "BR", currency: "BRL", symbol: "R$", rate: 0.0095 },
  { code: "GB", currency: "GBP", symbol: "£", rate: 0.0013 },
  { code: "CA", currency: "CAD", symbol: "$", rate: 0.0022 },
  { code: "US", currency: "USD", symbol: "$", rate: 0.0016 },
  ...["FR", "DE", "ES", "IT", "PT", "BE", "NL", "IE", "LU", "AT", "FI", "GR"].map(
    (code) => ({ code, currency: "EUR", symbol: "€", rate: 0.0015 }),
  ),
];

export function formatPrice(countryCode: string): string {
  const config =
    PRICING_TABLE.find((c) => c.code === countryCode) ??
    PRICING_TABLE.find((c) => c.code === "US")!;
  const converted = BASE_PRICE_XOF * config.rate;
  if (config.symbol === "€") return `${converted.toFixed(2).replace(".", ",")} €`;
  if (config.symbol === "$") return `$${converted.toFixed(2)}`;
  if (config.symbol === "MAD" || config.symbol === "TND")
    return `${converted.toFixed(2)} ${config.symbol}`;
  return `${Math.round(converted).toLocaleString("fr-FR")} ${config.symbol}`;
}

/** Affichage multi-devises : local (si distinct) + USD + EUR. */
export function formatPriceBreakdown(countryCode: string): {
  primary: string;
  usd: string;
  eur: string;
  lines: string[];
} {
  const usdRate = PRICING_TABLE.find((c) => c.code === "US")!.rate;
  const eurRate = PRICING_TABLE.find((c) => c.code === "FR")!.rate;
  const usd = `$${(BASE_PRICE_XOF * usdRate).toFixed(2)}`;
  const eur = `${(BASE_PRICE_XOF * eurRate).toFixed(2).replace(".", ",")} €`;
  const primary = formatPrice(countryCode);
  const config = PRICING_TABLE.find((c) => c.code === countryCode);
  const isUsd = config?.currency === "USD" || !config;
  const isEur = config?.currency === "EUR";
  const lines: string[] = [primary];
  if (!isUsd) lines.push(usd);
  if (!isEur) lines.push(eur);
  const unique = Array.from(new Set(lines));
  return { primary, usd, eur, lines: unique };
}

export const DEMO_REPLIES: Record<string, string> = {
  "demo-elena":
    "Ravie de vous lire. Dites-moi ce qui vous a fait sourire aujourd’hui.",
  "demo-marc": "Content de vous rencontrer ici. Vous êtes de quelle ville ?",
  "demo-amina":
    "Merci pour votre message. Quelle est la chose qui vous rend vraiment heureux ?",
  "demo-yann": "Enchanté. Racontez-moi votre plus beau souvenir de voyage.",
  "demo-nadia": "Quel plaisir de vous lire. Quel est votre livre préféré ?",
  "demo-ken":
    "Salut, ça fait plaisir. Vous aimez plutôt sortir ou rester au calme ?",
  "demo-lea":
    "Hello. Je suis curieuse : quel est votre projet favori en ce moment ?",
  "demo-sofiane":
    "Content de faire votre connaissance. Vous faites du sport vous aussi ?",
  "demo-ines": "Avec plaisir. Qu’est-ce qui vous amène sur NAYORA ?",
  "demo-ibrahim":
    "Ravi. Parlons peu, parlons vrai — qu’est-ce que vous cherchez ici ?",
};

export function pairIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function compatibilityScore(me: {
  intention: string;
  universes?: string[];
  country: string;
  city: string;
  ageBand: string;
  familyStatus: string;
  gender: string;
  lookingFor: string;
  languages?: string[];
  loveLanguage?: string | null;
}, them: {
  intention: string;
  universes?: string[];
  country: string;
  city: string;
  ageBand: string;
  familyStatus: string;
  gender: string;
  lookingFor: string;
  languages?: string[];
  loveLanguage?: string | null;
}): number {
  let score = 42;
  const sharedUniverse =
    me.universes?.length && them.universes?.length
      ? me.universes.some((u) => them.universes!.includes(u))
      : Boolean(me.intention && me.intention === them.intention);
  if (sharedUniverse) score += 22;
  if (me.country && me.country === them.country) score += 12;
  if (me.city && them.city && me.city.toLowerCase() === them.city.toLowerCase())
    score += 8;
  if (me.ageBand && me.ageBand === them.ageBand) score += 10;
  else if (me.ageBand && them.ageBand) {
    const i = AGE_BANDS.indexOf(me.ageBand as AgeBand);
    const j = AGE_BANDS.indexOf(them.ageBand as AgeBand);
    if (i >= 0 && j >= 0 && Math.abs(i - j) === 1) score += 5;
  }
  if (me.familyStatus && me.familyStatus === them.familyStatus) score += 4;
  const genderOk =
    me.lookingFor === "tous" || me.lookingFor === them.gender;
  const lookingOk =
    them.lookingFor === "tous" || them.lookingFor === me.gender;
  const loveShared =
    !me.universes?.length || !them.universes?.length ||
    (me.universes.includes("mariage") && them.universes.includes("mariage"));
  if (loveShared && genderOk && lookingOk) score += 8;
  if (me.languages?.length && them.languages?.length) {
    const shared = me.languages.some((l) => them.languages!.includes(l));
    if (shared) score += me.country === them.country ? 3 : 6;
  }
  if (me.loveLanguage && me.loveLanguage === them.loveLanguage) score += 4;
  return Math.max(24, Math.min(98, score));
}
