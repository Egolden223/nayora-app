export const LANGS = ["fr", "en", "ar", "es", "pt"] as const;
export type Lang = (typeof LANGS)[number];

/** Temporary slim dictionary — full i18n to be restored from artifacts/i18n_rayine.ts */
const dict: Record<Lang, Record<string, string>> = {
  fr: {
    appTagline: "Connecter autrement.",
    signIn: "Connexion",
    signUp: "Créer un compte",
    email: "E-mail",
    password: "Mot de passe",
    installTitle: "Installer RAYINE",
    installAndroid: "Ajoutez RAYINE à votre écran d'accueil.",
    installIos: "Appuyez sur Partager, puis « Sur l'écran d'accueil ».",
    install: "Installer",
    installDismiss: "Plus tard",
    noAccount: "Pas encore de compte ?",
    hasAccount: "Déjà membre ?",
    continue: "Continuer",
    loading: "Chargement…",
    navDiscover: "Découvrir",
    navMatches: "Matchs",
    navEvents: "Cercles",
    navPremium: "Prestige",
    navProfile: "Profil",
    premiumTitle: "RAYINE Prestige",
    authError: "Une erreur est survenue.",
  },
  en: {
    appTagline: "Connect differently.",
    signIn: "Sign in",
    signUp: "Create account",
    email: "Email",
    password: "Password",
    installTitle: "Install RAYINE",
    installAndroid: "Add RAYINE to your home screen.",
    installIos: "Tap Share, then Add to Home Screen.",
    install: "Install",
    installDismiss: "Later",
    noAccount: "No account yet?",
    hasAccount: "Already a member?",
    continue: "Continue",
    loading: "Loading…",
    navDiscover: "Discover",
    navMatches: "Matches",
    navEvents: "Circles",
    navPremium: "Prestige",
    navProfile: "Profile",
    premiumTitle: "RAYINE Prestige",
    authError: "Something went wrong.",
  },
  ar: {},
  es: {},
  pt: {},
};

const DISPLAY_LOCALE: Record<Lang, string> = {
  fr: "fr",
  en: "en",
  ar: "ar",
  es: "es",
  pt: "pt",
};

export function t(lang: Lang, key: string): string {
  const raw =
    dict[lang]?.[key] ?? dict.en?.[key] ?? dict.fr?.[key] ?? key;
  return raw.replace(/NAYORA/g, "RAYINE").replace(/Nayora/g, "Rayine");
}

export function countryName(lang: Lang, code: string): string {
  try {
    return (
      new Intl.DisplayNames([DISPLAY_LOCALE[lang]], { type: "region" }).of(
        code.toUpperCase(),
      ) ?? code
    );
  } catch {
    return code;
  }
}

export function languageName(lang: Lang, code: string): string {
  try {
    return (
      new Intl.DisplayNames([DISPLAY_LOCALE[lang]], { type: "language" }).of(
        code,
      ) ?? code
    );
  } catch {
    return code;
  }
}

export function sortedCountryCodes(
  lang: Lang,
  codes: readonly string[],
): string[] {
  const collator = new Intl.Collator(DISPLAY_LOCALE[lang]);
  return [...codes].sort((a, b) =>
    collator.compare(countryName(lang, a), countryName(lang, b)),
  );
}

export function isRtl(lang: Lang): boolean {
  return lang === "ar";
}
