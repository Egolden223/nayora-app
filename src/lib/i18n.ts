export const LANGS = ["fr", "en", "ar", "es", "pt"] as const;
export type Lang = (typeof LANGS)[number];

// NOTE: Full multi-lang dictionaries temporarily reduced: ar/es/pt use EN.
// Full 5-lang file available at artifacts if needed.
const fr = {
  appTagline: "Connecter autrement.",
  installTitle: "Installer RAYINE",
  installAndroid: "Ajoutez RAYINE à votre écran d'accueil.",
  premiumTitle: "RAYINE Prestige",
} as Record<string, string>;

const en = {
  appTagline: "Connect differently.",
  installTitle: "Install RAYINE",
  installAndroid: "Add RAYINE to your home screen.",
  premiumTitle: "RAYINE Prestige",
} as Record<string, string>;

const dict: Record<Lang, Record<string, string>> = {
  fr,
  en,
  ar: en,
  es: en,
  pt: en,
};

const DISPLAY_LOCALE: Record<Lang, string> = {
  fr: "fr",
  en: "en",
  ar: "ar",
  es: "es",
  pt: "pt",
};

export function t(lang: Lang, key: string): string {
  const raw = dict[lang]?.[key] ?? dict.fr[key] ?? key;
  return String(raw).replace(/NAYORA/g, "RAYINE").replace(/Nayora/g, "Rayine");
}

export function countryName(lang: Lang, code: string): string {
  try {
    return new Intl.DisplayNames([DISPLAY_LOCALE[lang]], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function languageName(lang: Lang, code: string): string {
  try {
    return new Intl.DisplayNames([DISPLAY_LOCALE[lang]], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function sortedCountryCodes(lang: Lang, codes: readonly string[]): string[] {
  const collator = new Intl.Collator(DISPLAY_LOCALE[lang]);
  return [...codes].sort((a, b) => collator.compare(countryName(lang, a), countryName(lang, b)));
}

export function isRtl(lang: Lang): boolean {
  return lang === "ar";
}
