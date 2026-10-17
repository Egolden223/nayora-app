import {
  loveDealbreaker,
  loveReasons,
  parseUniverseData,
  sanitizeUniverseData,
  scoreUniverse,
  travelIncompatible,
  diasporaBonus,
  UNIVERSE_FACETS,
  type UniverseData,
} from "@/lib/universe-match";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { ageBandFromBirthDate, ageFromBirthDate, stripPrivateIdentity } from "@/lib/privacy";
import {
  ABUSE_PATTERN,
  containsPhoneNumber,
  compatibilityScore,
  DEMO_REPLIES,
  FREE_CHAT_LIMIT,
  INTENTIONS,
  LANGUAGE_CODES,
  LIKE_LIMIT_PER_HOUR,
  MIN_AGE_YEARS,
  pairIds,
  COUNTRY_CODES,
  parseUniverses,
  PRO_DOMAINS,
  SCAM_HARD_PATTERN,
  SCAM_SOFT_PATTERN,
  trustRules,
  UNIVERSES_WITH_DOMAIN,
} from "@/lib/constants";

export type Profile = {
  id: number;
  userId: string;
  /** Pseudo public affiché aux autres membres. */
  firstName: string;
  ageBand: string;
  /** Date de naissance : privée (modération, contrôle des 18 ans) — jamais envoyée aux autres membres. */
  birthDate?: string | null;
  gender: string;
  lookingFor: string;
  city: string;
  country: string;
  familyStatus: string;
  intention: string;
  /** Tous les univers RAYINE du profil (le premier = principal = `intention`). */
  universes: string[];
  /** Profil propre à chaque univers (objectif pro, intérêts, style de voyage, rôle projet…). */
  universeData: UniverseData;
  proDomain: string | null;
  bio: string;
  phone: string | null;
  isPremium: boolean;
  /** Date de fin d'abonnement Prestige (ISO). Null = legacy / permanent tant que is_premium. */
  premiumUntil: string | null;
  /** Jours restants calculés côté serveur (0 si expiré ou non abonné). */
  premiumDaysLeft: number;
  bonusChats: number;
  verificationStatus: string;
  /** Statut de la pièce d'identité (niveau 3) : non_soumis | en_revue | verifie | refuse. */
  idDocumentStatus: string;
  phoneVerified: boolean;
  reliabilityScore: number;
  charterAccepted: boolean;
  isDemo: boolean;
  suspended: boolean;
  photoUrl: string | null;
  /** Miniature floutée (générée dans le navigateur) — sert tant qu'il n'y a pas de match. */
  photoBlurUrl: string | null;
  /** Le membre floute sa photo jusqu'au match. */
  blurPhotos: boolean;
  /** Vrai quand `photoUrl` est la version floutée (le serveur n'envoie alors PAS l'original). */
  photoHidden: boolean;
  /** Rencontres planifiées notées par l'autre partie (moyenne sur 5, null si aucune). */
  meetCount: number;
  meetRating: number | null;
  /** Avis de voyage reçus (moyenne sur 5, null si aucun). */
  tripReviewCount: number;
  tripRating: number | null;
  /** Pages « impact » (max. 5). */
  impactStories: ImpactStory[];
  heightCm: number | null;
  weightKg: number | null;
  profession: string | null;
  languages: string[];
  selfieUrl: string | null;
  loveLanguage: string | null;
  weekendStyle: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  responsiveFast: boolean;
  referralCode: string | null;
  featuredOk: boolean;
};

export type ImpactStory = { title: string; summary: string; cause: string };

export type DiscoverCard = Profile & {
  score: number;
  alreadyLiked: boolean;
  /** Univers dans lequel cette personne vous correspond le mieux. */
  matchUniverse: string;
  /** Clés i18n `r_*` expliquant pourquoi (objectifs complémentaires, centres d'intérêt communs…). */
  reasons: string[];
  /** True si plusieurs signalements anonymes (seuil de confiance). */
  reportFlag?: boolean;
};

export type MatchRow = {
  id: number;
  partner: Profile;
  createdAt: string;
  lastMessage: string | null;
  lastAt: string | null;
  locked: boolean;
  contactStatus: "none" | "pending" | "accepted" | "declined";
  contactMine: boolean;
  revealedPhone: string | null;
};

export type ChatMessage = {
  id: number;
  matchId: number;
  senderId: string;
  body: string;
  kind: "text" | "voice";
  audioUrl: string | null;
  createdAt: string;
};

/** ~1 MB decoded — a short voice note compressed client-side (opus/webm). */
const MAX_AUDIO_DATA_URL_LENGTH = 1_400_000;

type ProfileRow = {
  id: number;
  user_id: string;
  first_name: string;
  age_band: string;
  birth_date?: string | null;
  gender: string;
  looking_for: string;
  city: string;
  country: string;
  family_status: string;
  intention: string;
  universes: string | null;
  universe_data: unknown;
  pro_domain: string | null;
  bio: string;
  phone: string | null;
  is_premium: boolean;
  premium_until: string | null;
  bonus_chats: number;
  verification_status: string;
  id_document_status: string | null;
  phone_verified: boolean | null;
  reliability_score: number;
  charter_accepted: boolean;
  is_demo: boolean;
  suspended: boolean;
  photo_url: string | null;
  photo_blur_url?: string | null;
  blur_photos?: boolean | null;
  meet_count?: number | null;
  meet_rating_sum?: number | null;
  trip_review_count?: number | null;
  trip_rating_sum?: number | null;
  impact_stories?: unknown;
  height_cm: number | null;
  weight_kg: number | null;
  profession: string | null;
  languages: string[] | null;
  selfie_url: string | null;
  love_language: string | null;
  weekend_style: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  reply_total: number;
  reply_within_day: number;
  referral_code: string | null;
  featured_ok: boolean;
};

function parseImpact(raw: unknown): ImpactStory[] {
  let v = raw;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is ImpactStory => !!x && typeof x.title === "string" && typeof x.summary === "string")
    .slice(0, 5)
    .map((x) => ({ title: x.title, summary: x.summary, cause: typeof x.cause === "string" ? x.cause : "" }));
}

/**
 * Confidentialité des photos : si le membre floute sa photo, on n'envoie à un
 * non-match QUE la miniature floutée (jamais l'original — le flou n'est donc
 * pas un simple effet CSS contournable).
 */
export function maskPhoto(p: Profile): Profile {
  if (!p.blurPhotos) return p;
  return { ...p, photoUrl: p.photoBlurUrl, photoHidden: true };
}

function mapProfile(r: ProfileRow): Profile {
  return {
    id: Number(r.id),
    userId: r.user_id,
    firstName: r.first_name,
    ageBand: r.age_band,
    birthDate: r.birth_date ? String(r.birth_date).slice(0, 10) : null,
    gender: r.gender,
    lookingFor: r.looking_for,
    city: r.city ?? "",
    country: r.country,
    familyStatus: r.family_status,
    intention: r.intention,
    universes: parseUniverses(r.universes, r.intention),
    universeData: parseUniverseData(r.universe_data),
    proDomain: r.pro_domain,
    bio: r.bio ?? "",
    phone: r.phone,
    isPremium: (() => {
      if (r.premium_until) {
        return new Date(r.premium_until).getTime() > Date.now();
      }
      return Boolean(r.is_premium);
    })(),
    premiumUntil: r.premium_until ? String(r.premium_until) : null,
    premiumDaysLeft: (() => {
      if (!r.premium_until) {
        return Boolean(r.is_premium) ? 365 : 0;
      }
      const ms = new Date(r.premium_until).getTime() - Date.now();
      if (ms <= 0) return 0;
      return Math.ceil(ms / (1000 * 60 * 60 * 24));
    })(),
    bonusChats: Number(r.bonus_chats ?? 0),
    verificationStatus: r.verification_status,
    idDocumentStatus: r.id_document_status ?? "non_soumis",
    phoneVerified: Boolean(r.phone_verified),
    reliabilityScore: Number(r.reliability_score ?? 100),
    charterAccepted: Boolean(r.charter_accepted),
    isDemo: Boolean(r.is_demo),
    suspended: Boolean(r.suspended),
    photoUrl: r.photo_url,
    photoBlurUrl: r.photo_blur_url ?? null,
    blurPhotos: Boolean(r.blur_photos),
    photoHidden: false,
    meetCount: Number(r.meet_count ?? 0),
    meetRating: Number(r.meet_count ?? 0) > 0 ? Number(r.meet_rating_sum ?? 0) / Number(r.meet_count) : null,
    tripReviewCount: Number(r.trip_review_count ?? 0),
    tripRating:
      Number(r.trip_review_count ?? 0) > 0 ? Number(r.trip_rating_sum ?? 0) / Number(r.trip_review_count) : null,
    impactStories: parseImpact(r.impact_stories),
    heightCm: r.height_cm === null || r.height_cm === undefined ? null : Number(r.height_cm),
    weightKg: r.weight_kg === null || r.weight_kg === undefined ? null : Number(r.weight_kg),
    profession: r.profession,
    languages: r.languages ?? [],
    // Le selfie de vérification est une donnée sensible : jamais renvoyé au
    // client (visible uniquement par les modérateurs via admin.ts).
    selfieUrl: null,
    loveLanguage: r.love_language,
    weekendStyle: r.weekend_style,
    emergencyName: r.emergency_name,
    emergencyPhone: r.emergency_phone,
    responsiveFast:
      Number(r.reply_total ?? 0) >= 3 &&
      Number(r.reply_within_day ?? 0) / Number(r.reply_total || 1) >= 0.7,
    referralCode: r.referral_code,
    featuredOk: Boolean(r.featured_ok),
  };
}

export async function loadProfile(userId: string): Promise<Profile | null> {
  const sql = await getSql();
  const rows = await sql.query<ProfileRow>(
    "select * from profiles where user_id = $1 limit 1",
    [userId],
  );
  return rows[0] ? mapProfile(rows[0]) : null;
}

export type ProfileInput = {
  /** Prénom ou pseudo affiché publiquement. */
  firstName: string;
  ageBand: string;
  /** Date de naissance (YYYY-MM-DD) — obligatoire (18 ans minimum), jamais montrée aux autres. */
  birthDate: string;
  gender: string;
  lookingFor: string;
  city: string;
  country: string;
  familyStatus: string;
  intention: string;
  /** Univers choisis (le premier devient l'univers principal). */
  universes: string[];
  universeData?: UniverseData;
  proDomain: string | null;
  bio: string;
  phone: string | null;
  photoUrl: string;
  /** Miniature floutée (data URL) et choix de la flouter jusqu'au match. */
  photoBlurUrl?: string | null;
  blurPhotos?: boolean;
  heightCm: number | null;
  weightKg: number | null;
  profession: string;
  languages: string[];
  loveLanguage: string | null;
  weekendStyle: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  referredBy: string | null;
  charterAccepted: boolean;
};

/** ~1.5 MB decoded — generous for a client-resized JPEG, tight enough to keep rows small. */
const MAX_PHOTO_DATA_URL_LENGTH = 2_000_000;

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return loadProfile(context.userId);
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: ProfileInput) => input)
  .handler(async ({ context, data }) => {
    const firstName = data.firstName.trim();
    if (!firstName) throw new Error("Le prénom ou pseudo est obligatoire");
    const birthDate = (data.birthDate ?? "").trim();
    if (!birthDate) throw new Error("La date de naissance est obligatoire");
    const age = ageFromBirthDate(birthDate);
    if (age < MIN_AGE_YEARS) throw new Error(`Tu dois avoir au moins ${MIN_AGE_YEARS} ans`);
    if (age > 120) throw new Error("Date de naissance invalide");
    const ageBand = ageBandFromBirthDate(birthDate);
    if (!data.charterAccepted) throw new Error("Tu dois accepter la charte");
    if (!data.photoUrl?.startsWith("data:image/"))
      throw new Error("La photo de profil est obligatoire");
    if (data.photoUrl.length > MAX_PHOTO_DATA_URL_LENGTH)
      throw new Error("Photo trop volumineuse");
    if (data.heightCm !== null && (data.heightCm < 100 || data.heightCm > 250))
      throw new Error("Taille invalide");
    if (data.weightKg !== null && (data.weightKg < 30 || data.weightKg > 300))
      throw new Error("Poids invalide");
    const phone = (data.phone ?? "").trim() || null;
    const languages = data.languages.filter((l) => LANGUAGE_CODES.includes(l as never)).slice(0, 8);
    const profession = data.profession.trim().slice(0, 120) || null;
    const universes = Array.from(
      new Set((data.universes ?? []).filter((u) => (INTENTIONS as readonly string[]).includes(u))),
    );
    if (!universes.length)
      universes.push(
        (INTENTIONS as readonly string[]).includes(data.intention) ? data.intention : "mariage",
      );
    const mainUniverse = universes[0];
    const universeData = sanitizeUniverseData(data.universeData, {
      domains: PRO_DOMAINS,
      countries: COUNTRY_CODES,
      universes,
    });
    const proDomain = universes.some((u) => UNIVERSES_WITH_DOMAIN.includes(u)) ? data.proDomain : null;
    const blurUrl =
      typeof data.photoBlurUrl === "string" &&
      data.photoBlurUrl.startsWith("data:image/") &&
      data.photoBlurUrl.length < 60_000
        ? data.photoBlurUrl
        : null;
    // Sans miniature floutée valide, on ne peut pas flouter : on n'active pas l'option.
    const blurPhotos = Boolean(data.blurPhotos) && blurUrl !== null;
    const sql = await getSql();
    const existing = await loadProfile(context.userId);
    if (existing) {
      await sql.query(
        `update profiles set
          first_name = $1, age_band = $2, gender = $3, looking_for = $4,
          city = $5, country = $6, family_status = $7, intention = $8,
          pro_domain = $9, bio = $10, phone = $11, photo_url = $12,
          height_cm = $13, weight_kg = $14, profession = $15, languages = $16,
          love_language = $17, weekend_style = $18, emergency_name = $19,
          emergency_phone = $20, universes = $21,
          universe_data = $22::jsonb,
          photo_blur_url = $23, blur_photos = $24,
          charter_accepted = true, updated_at = now()
         where user_id = $25`,
        [
          firstName,
          ageBand,
          data.gender,
          data.lookingFor,
          data.city.trim(),
          data.country,
          data.familyStatus,
          mainUniverse,
          proDomain,
          data.bio.trim(),
          phone,
          data.photoUrl,
          data.heightCm,
          data.weightKg,
          profession,
          languages,
          data.loveLanguage,
          data.weekendStyle,
          data.emergencyName?.trim() || null,
          data.emergencyPhone?.trim() || null,
          universes.join(","),
          JSON.stringify(universeData),
          blurUrl,
          blurPhotos,
          context.userId,
        ],
      );
    } else {
      const referralCode = `${firstName.slice(0, 3).toUpperCase()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      await sql.query(
        `insert into profiles (
          user_id, first_name, age_band, gender, looking_for, city, country,
          family_status, intention, pro_domain, bio, phone, photo_url,
          height_cm, weight_kg, profession, languages,
          love_language, weekend_style, emergency_name, emergency_phone,
          referral_code, referred_by, universes, universe_data,
          photo_blur_url, blur_photos,
          charter_accepted, verification_status
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25::jsonb,$26,$27,true,'non_soumis')`,
        [
          context.userId,
          firstName,
          ageBand,
          data.gender,
          data.lookingFor,
          data.city.trim(),
          data.country,
          data.familyStatus,
          mainUniverse,
          proDomain,
          data.bio.trim(),
          phone,
          data.photoUrl,
          data.heightCm,
          data.weightKg,
          profession,
          languages,
          data.loveLanguage,
          data.weekendStyle,
          data.emergencyName?.trim() || null,
          data.emergencyPhone?.trim() || null,
          referralCode,
          data.referredBy?.trim().toUpperCase() || null,
          universes.join(","),
          JSON.stringify(universeData),
          blurUrl,
          blurPhotos,
        ],
      );
    }
    // Date de naissance privée (colonne 0011) : sert au contrôle des 18 ans, jamais renvoyée aux autres membres.
    await sql.query(
      "update profiles set birth_date = $1::date, age_band = $2, updated_at = now() where user_id = $3",
      [birthDate, ageBand, context.userId],
    );
    return loadProfile(context.userId);
  });

/**
 * Vérification par selfie — facultative. La soumettre ne rend PAS le profil
 * vérifié immédiatement : elle passe en revue, et seul un modérateur qui
 * compare le selfie à la photo de profil (panel /admin) accorde le badge.
 */
export const submitSelfie = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { selfieUrl: string }) => input)
  .handler(async ({ context, data }) => {
    if (!data.selfieUrl?.startsWith("data:image/"))
      throw new Error("Selfie invalide");
    if (data.selfieUrl.length > MAX_PHOTO_DATA_URL_LENGTH)
      throw new Error("Photo trop volumineuse");
    const sql = await getSql();
    await sql.query(
      `update profiles set selfie_url = $1, verification_status = 'en_revue', updated_at = now()
       where user_id = $2`,
      [data.selfieUrl, context.userId],
    );
    return loadProfile(context.userId);
  });

/**
 * Vérification d'identité niveau 3 — pièce officielle (facultative). Stockée
 * côté serveur uniquement : elle n'est jamais renvoyée aux autres membres ni
 * au client (le profil n'expose que le statut). Un modérateur la compare au
 * profil dans /admin puis accorde ou refuse.
 */
export const submitIdDocument = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { documentUrl: string }) => input)
  .handler(async ({ context, data }) => {
    if (!data.documentUrl?.startsWith("data:image/")) throw new Error("Document invalide");
    if (data.documentUrl.length > MAX_PHOTO_DATA_URL_LENGTH) throw new Error("Document trop volumineux");
    const sql = await getSql();
    await sql.query(
      `update profiles set id_document_url = $1, id_document_status = 'en_revue', updated_at = now()
       where user_id = $2`,
      [data.documentUrl, context.userId],
    );
    return loadProfile(context.userId);
  });

/** Consentement à être republié (réseaux sociaux, "profil du jour") — révocable à tout moment. */
export const setFeaturedOk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { featuredOk: boolean }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql.query("update profiles set featured_ok = $1 where user_id = $2", [
      data.featuredOk,
      context.userId,
    ]);
    return { ok: true as const };
  });

export type DiscoverFilters = {
  ageBand: string;
  gender: string;
  intention: string;
  /** Empty = all countries. */
  countries: string[];
  familyStatus: string;
  /** Filtre propre à l'univers choisi (objectif pro, intérêt, style de voyage, rôle projet) ; "all" = aucun. */
  facet?: string;
  /** Ne montrer que les profils dont le selfie a été contrôlé. */
  verifiedOnly?: boolean;
  /** Mode diaspora : prioriser / filtrer les profils même origine à l'étranger. */
  diasporaOnly?: boolean;
  /** Passeport : apparaître comme si on était dans ce pays (filtre pays de destination). */
  passportCountry?: string;
  /** Âge minimum / maximum (Love) — calculé côté serveur via birth_date. */
  ageMin?: number;
  ageMax?: number;
  /** Taille minimum en cm (Love). */
  heightMin?: number;
  /** Religion (Love) — "all" = aucun filtre. */
  religion?: string;
  /** Ville facultative (Love) — correspondance souple. */
  city?: string;
};

export const listDiscover = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: DiscoverFilters) => input)
  .handler(async ({ context, data }) => {
    const me = await loadProfile(context.userId);
    if (!me) return [] as DiscoverCard[];
    // Isolation par univers : toujours un univers concret (pas « tous »).
    if (!data.intention || data.intention === "all") {
      data = {
        ...data,
        intention: me.universes[0] ?? me.intention ?? "mariage",
      };
    }
    const sql = await getSql();
    const rows = await sql.query<ProfileRow>(
      `select * from profiles p
       where p.user_id <> $1
         and p.suspended = false
         and p.user_id not in (select passed_id from passes where passer_id = $1)
         and p.user_id not in (select blocked_id from blocks where blocker_id = $1)
         and p.user_id not in (select blocker_id from blocks where blocked_id = $1)
         and not exists (
           select 1 from matches m
           where (m.user_a = $1 and m.user_b = p.user_id)
              or (m.user_b = $1 and m.user_a = p.user_id)
         )
       order by p.is_demo desc, p.created_at desc`,
      [context.userId],
    );
    const likedRows = await sql.query<{ liked_id: string }>(
      "select liked_id from likes where liker_id = $1",
      [context.userId],
    );
    const liked = new Set(likedRows.map((r) => r.liked_id));

    // Signalements anonymisés : profils avec ≥ 2 reports distincts
    let reportedHeavy = new Set<string>();
    try {
      const repRows = await sql.query<{ reported_id: string; c: number }>(
        `select reported_id, count(distinct reporter_id)::int as c
         from reports
         group by reported_id
         having count(distinct reporter_id) >= 2`,
      );
      reportedHeavy = new Set(repRows.map((r) => r.reported_id));
    } catch {
      /* table absente en dev */
    }

    const wantedUniverse =
      data.intention && data.intention !== "all" ? data.intention : null;
    // La compatibilité de genre (qui cherche qui) ne s'applique qu'à
    // l'univers Love ; Friends, Pro, Travel et Projects n'en dépendent pas.
    const loveCompatible = (c: Profile) =>
      (me.lookingFor === "tous" || c.gender === me.lookingFor) &&
      (c.lookingFor === "tous" || c.lookingFor === me.gender) &&
      // incompatibilités rédhibitoires déclarées (polygamie, religion « essentielle »)
      !loveDealbreaker(me, c);
    // Travel : cercles réservés aux femmes (sécurité).
    // Travel : un guide n'est listé que s'il est vérifié (selfie contrôlé) — sécurité des voyageurs.
    const universeOk = (u: string, c: Profile) =>
      u === "mariage"
        ? loveCompatible(c)
        : u === "voyage"
          ? !travelIncompatible(me, c) &&
            !(c.universeData.travelGoal === "guide" && c.verificationStatus !== "verifie")
          : true;

    // Chaque univers a sa propre logique d'appariement (universe-match.ts) :
    // on retient, pour chaque profil, l'univers où la correspondance est la meilleure.
    const matchedRows = await sql.query<{ user_a: string; user_b: string }>(
      "select user_a, user_b from matches where user_a = $1 or user_b = $1",
      [context.userId],
    );
    const matchedIds = new Set(matchedRows.map((m) => (m.user_a === context.userId ? m.user_b : m.user_a)));

    let cards: DiscoverCard[] = rows.map((r) => {
      const full = mapProfile(r);
      // Photo floutée tant qu'il n'y a pas de match (l'original n'est pas envoyé).
      const p = stripPrivateIdentity(
        matchedIds.has(full.userId) ? full : maskPhoto(full),
      );
      const candidates = wantedUniverse
        ? [wantedUniverse]
        : p.universes.filter((u) => me.universes.includes(u));
      let best = { universe: candidates[0] ?? p.intention, score: 0, reasons: [] as string[] };
      for (const u of candidates) {
        if (!universeOk(u, p)) continue;
        let m: { score: number; reasons: string[] };
        if (u === "mariage") {
          const love = loveReasons(me, p);
          m = {
            score: Math.max(24, Math.min(98, compatibilityScore(me, p) + love.score)),
            reasons: love.reasons,
          };
        } else m = scoreUniverse(u, me, p);
        if (m.score > best.score) best = { universe: u, score: m.score, reasons: m.reasons };
      }
      // Bonus diaspora (Love / Friends)
      let score = best.score || compatibilityScore(me, p);
      let reasons = [...best.reasons];
      if (best.universe === "mariage" || best.universe === "amitie") {
        const dia = diasporaBonus(me, p);
        score = Math.min(98, score + dia.score);
        reasons = [...reasons, ...dia.reasons];
      }
      return {
        ...p,
        alreadyLiked: liked.has(p.userId),
        score,
        matchUniverse: best.universe,
        reasons,
        reportFlag: reportedHeavy.has(p.userId),
      };
    });

    cards = cards.filter((c) => {
      const wanted = data.intention && data.intention !== "all" ? data.intention : null;
      if (wanted) {
        if (!c.universes.includes(wanted)) return false;
        if (!universeOk(wanted, c)) return false;
      } else {
        // "Tous les univers" : au moins un univers en commun avec moi.
        const shared = c.universes.filter((u) => me.universes.includes(u));
        if (!shared.some((u) => universeOk(u, c))) return false;
      }
      if (data.ageMin != null || data.ageMax != null) {
        let age = -1;
        if (c.birthDate) age = ageFromBirthDate(c.birthDate);
        if (age < 0 && c.ageBand) {
          const mid: Record<string, number> = {
            "18-24": 21, "25-29": 27, "30-34": 32, "35-39": 37, "40-49": 44, "50+": 55,
          };
          age = mid[c.ageBand] ?? -1;
        }
        if (age >= 0) {
          if (data.ageMin != null && age < data.ageMin) return false;
          if (data.ageMax != null && age > data.ageMax) return false;
        }
      }
      if (data.heightMin != null && data.heightMin > 0) {
        if (c.heightCm == null || c.heightCm < data.heightMin) return false;
      }
      if (data.religion && data.religion !== "all") {
        const theirRel = c.universeData?.religion;
        if (!theirRel || theirRel !== data.religion) return false;
      }
      if (data.city && data.city.trim()) {
        const q = data.city.trim().toLowerCase();
        if (!(c.city || "").toLowerCase().includes(q)) return false;
      }
      if (data.verifiedOnly && c.verificationStatus !== "verifie") return false;
      if (wanted && data.facet && data.facet !== "all") {
        const facet = UNIVERSE_FACETS[wanted];
        if (facet) {
          const v = c.universeData[facet.field];
          const ok = Array.isArray(v) ? v.includes(data.facet) : v === data.facet;
          if (!ok) return false;
        }
      }
      if (data.gender && data.gender !== "all" && c.gender !== data.gender)
        return false;
      if (data.ageBand && data.ageBand !== "all" && c.ageBand !== data.ageBand)
        return false;
      if (data.countries?.length && !data.countries.includes(c.country))
        return false;
      // Passeport : traiter passportCountry du filtre comme pays de présence
      if (data.passportCountry && data.passportCountry !== "all") {
        const theirPass = c.universeData.passportCountry || c.country;
        if (theirPass !== data.passportCountry && c.country !== data.passportCountry) return false;
      }
      if (data.diasporaOnly) {
        const myOrigin = me.universeData.originCountry || me.country;
        const theirOrigin = c.universeData.originCountry || c.country;
        const open =
          me.universeData.openToDiaspora === "oui" || c.universeData.openToDiaspora === "oui";
        if (!myOrigin || theirOrigin !== myOrigin || !open) return false;
      }
      if (
        data.familyStatus &&
        data.familyStatus !== "all" &&
        c.familyStatus !== data.familyStatus
      )
        return false;
      if (c.reliabilityScore < 50) return false;
      return true;
    });

    // Les meilleures correspondances d'abord ; les profils déjà likés en dernier.
    cards.sort(
      (a, b) => Number(a.alreadyLiked) - Number(b.alreadyLiked) || b.score - a.score,
    );
    return cards;
  });

export type CuratedSuggestion = { id: number; note: string | null; profile: Profile };

/** Sélection "concierge" en attente pour l'utilisateur courant (voir admin.ts). */
export const listMySuggestions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CuratedSuggestion[]> => {
    const sql = await getSql();
    const rows = await sql.query<{ id: number; suggested_user_id: string; note: string | null }>(
      "select id, suggested_user_id, note from curated_suggestions where user_id = $1 and dismissed = false order by created_at desc limit 10",
      [context.userId],
    );
    const out: CuratedSuggestion[] = [];
    for (const r of rows) {
      const profile = await loadProfile(r.suggested_user_id);
      if (profile) out.push({ id: Number(r.id), note: r.note, profile: stripPrivateIdentity(maskPhoto(profile)) });
    }
    return out;
  });

export const dismissSuggestion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql.query(
      "update curated_suggestions set dismissed = true where id = $1 and user_id = $2",
      [data.id, context.userId],
    );
    return { ok: true as const };
  });

export const passProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string }) => input)
  .handler(async ({ context, data }) => {
    if (!data.userId || data.userId === context.userId) return { ok: true };
    const sql = await getSql();
    await sql.query(
      "insert into passes (passer_id, passed_id) values ($1,$2) on conflict do nothing",
      [context.userId, data.userId],
    );
    return { ok: true };
  });

export const addLike = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; likedOn?: string; note?: string }) => input)
  .handler(async ({ context, data }) => {
    if (!data.userId || data.userId === context.userId) {
      return { status: "ignored" as const };
    }
    const sql = await getSql();
    const recentLikes = await sql.query<{ c: number }>(
      `select count(*)::int as c from likes
       where liker_id = $1 and created_at > now() - interval '1 hour'`,
      [context.userId],
    );
    if ((recentLikes[0]?.c ?? 0) >= LIKE_LIMIT_PER_HOUR) {
      return { status: "rate_limited" as const };
    }
    const them = await loadProfile(data.userId);
    if (!them) return { status: "ignored" as const };

    const likedOn = ["profile", "photo", "bio", "reason"].includes(data.likedOn ?? "")
      ? data.likedOn
      : "profile";
    const note = (data.note ?? "").trim().slice(0, 200) || null;

    // Colonnes liked_on / note optionnelles (migration 0013) — fallback sans colonnes.
    try {
      await sql.query(
        `insert into likes (liker_id, liked_id, liked_on, note) values ($1,$2,$3,$4)
         on conflict do nothing`,
        [context.userId, data.userId, likedOn, note],
      );
    } catch {
      await sql.query(
        "insert into likes (liker_id, liked_id) values ($1,$2) on conflict do nothing",
        [context.userId, data.userId],
      );
    }

    const reciprocal = await sql.query<{ id: number }>(
      "select id from likes where liker_id = $1 and liked_id = $2 limit 1",
      [data.userId, context.userId],
    );
    const matched = them.isDemo || reciprocal.length > 0;

    if (matched) {
      if (them.isDemo) {
        await sql.query(
          "insert into likes (liker_id, liked_id) values ($1,$2) on conflict do nothing",
          [data.userId, context.userId],
        );
      }
      const [a, b] = pairIds(context.userId, data.userId);
      const inserted = await sql.query<{ id: number }>(
        "insert into matches (user_a, user_b) values ($1,$2) on conflict do nothing returning id",
        [a, b],
      );
      const existing = inserted[0]
        ? inserted
        : await sql.query<{ id: number }>(
            "select id from matches where user_a = $1 and user_b = $2",
            [a, b],
          );
      return {
        status: "matched" as const,
        matchId: existing[0]?.id ?? 0,
        partner: stripPrivateIdentity(them),
      };
    }
    return { status: "liked" as const, partner: stripPrivateIdentity(maskPhoto(them)) };
  });

/**
 * Personnes qui ont manifesté un intérêt (like) pour toi, que tu n'as pas encore
 * likées ni passées, et avec qui tu n'as pas encore de match.
 * Tu peux consulter leur profil avant de décider d'accepter (like en retour → match)
 * ou de refuser (pass).
 */
export const listReceivedLikes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await loadProfile(context.userId);
    if (!me) return [] as DiscoverCard[];
    const sql = await getSql();

    // Qui m'a liké et que je n'ai pas encore liké / passé / matché / bloqué.
    const rows = await sql.query<{ liker_id: string; created_at: string }>(
      `select l.liker_id, l.created_at
       from likes l
       where l.liked_id = $1
         and l.liker_id not in (select liked_id from likes where liker_id = $1)
         and l.liker_id not in (select passed_id from passes where passer_id = $1)
         and l.liker_id not in (select blocked_id from blocks where blocker_id = $1)
         and l.liker_id not in (select blocker_id from blocks where blocked_id = $1)
         and not exists (
           select 1 from matches m
           where (m.user_a = $1 and m.user_b = l.liker_id)
              or (m.user_b = $1 and m.user_a = l.liker_id)
         )
       order by l.created_at desc`,
      [context.userId],
    );

    const cards: DiscoverCard[] = [];
    for (const r of rows) {
      const full = await loadProfile(r.liker_id);
      if (!full || full.suspended) continue;
      // On montre la photo (éventuellement floutée) pour que la personne puisse
      // se faire une idée avant d'accepter.
      const p = stripPrivateIdentity(maskPhoto(full));
      const shared = p.universes.filter((u) => me.universes.includes(u));
      let best = { universe: shared[0] ?? p.intention, score: 0, reasons: [] as string[] };
      for (const u of shared.length ? shared : [p.intention]) {
        let m: { score: number; reasons: string[] };
        if (u === "mariage") {
          const love = loveReasons(me, p);
          m = {
            score: Math.max(24, Math.min(98, compatibilityScore(me, p) + love.score)),
            reasons: love.reasons,
          };
        } else {
          m = scoreUniverse(u, me, p);
        }
        if (m.score > best.score) best = { universe: u, score: m.score, reasons: m.reasons };
      }
      cards.push({
        ...p,
        alreadyLiked: false,
        score: best.score || compatibilityScore(me, p),
        matchUniverse: best.universe,
        reasons: best.reasons,
      });
    }
    return cards;
  });

export async function matchAccess(
  matchId: number,
  userId: string,
): Promise<{ id: number; user_a: string; user_b: string } | null> {
  const sql = await getSql();
  const rows = await sql.query<{ id: number; user_a: string; user_b: string }>(
    "select id, user_a, user_b from matches where id = $1 limit 1",
    [matchId],
  );
  const m = rows[0];
  if (!m) return null;
  if (m.user_a !== userId && m.user_b !== userId) return null;
  return m;
}

function partnerId(m: { user_a: string; user_b: string }, me: string) {
  return m.user_a === me ? m.user_b : m.user_a;
}

function isLocked(
  index: number,
  premium: boolean,
  bonusChats: number,
): boolean {
  if (premium) return false;
  return index >= FREE_CHAT_LIMIT + bonusChats;
}

export const listMatches = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const me = await loadProfile(context.userId);
    if (!me) return [] as MatchRow[];
    const sql = await getSql();
    const rows = await sql.query<{
      id: number;
      user_a: string;
      user_b: string;
      created_at: string;
    }>(
      "select id, user_a, user_b, created_at from matches where user_a = $1 or user_b = $1 order by created_at asc",
      [context.userId],
    );

    const out: MatchRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const m = rows[i];
      const pid = partnerId(m, context.userId);
      const partner = await loadProfile(pid);
      if (!partner) continue;
      const blocked = await sql.query<{ id: number }>(
        "select id from blocks where (blocker_id = $1 and blocked_id = $2) or (blocker_id = $2 and blocked_id = $1) limit 1",
        [context.userId, pid],
      );
      if (blocked[0]) continue;

      const last = await sql.query<{ body: string; created_at: string }>(
        "select body, created_at from messages where match_id = $1 order by created_at desc limit 1",
        [m.id],
      );
      const cr = await sql.query<{
        requester_id: string;
        status: string;
      }>(
        "select requester_id, status from contact_requests where match_id = $1 order by created_at desc limit 1",
        [m.id],
      );
      const contact = cr[0];
      const accepted = contact?.status === "accepted";
      const phone = partner.phone;
      out.push({
        id: m.id,
        partner: stripPrivateIdentity(partner),
        createdAt: String(m.created_at),
        lastMessage: last[0]?.body ?? null,
        lastAt: last[0] ? String(last[0].created_at) : null,
        locked: isLocked(i, me.isPremium, me.bonusChats),
        contactStatus: contact
          ? (contact.status as MatchRow["contactStatus"])
          : "none",
        contactMine: contact?.requester_id === context.userId,
        revealedPhone: accepted ? phone : null,
      });
    }
    return out.reverse();
  });

export const listMessages = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number }) => input)
  .handler(async ({ context, data }) => {
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) return [] as ChatMessage[];
    const me = await loadProfile(context.userId);
    if (!me) return [];
    const sql = await getSql();
    const ordered = await sql.query<{ id: number }>(
      "select id from matches where user_a = $1 or user_b = $1 order by created_at asc",
      [context.userId],
    );
    const idx = ordered.findIndex((r) => r.id === m.id);
    if (isLocked(idx, me.isPremium, me.bonusChats)) return [];
    const rows = await sql.query<{
      id: number;
      match_id: number;
      sender_id: string;
      body: string;
      kind: string;
      audio_url: string | null;
      created_at: string;
    }>(
      "select id, match_id, sender_id, body, kind, audio_url, created_at from messages where match_id = $1 order by created_at asc",
      [m.id],
    );
    return rows.map((r) => ({
      id: Number(r.id),
      matchId: Number(r.match_id),
      senderId: r.sender_id,
      body: r.body,
      kind: (r.kind as ChatMessage["kind"]) ?? "text",
      audioUrl: r.audio_url,
      createdAt: String(r.created_at),
    }));
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number; body: string }) => input)
  .handler(async ({ context, data }) => {
    const body = data.body.trim();
    if (!body) throw new Error("Message vide");
    if (body.length > 2000) throw new Error("Message trop long");
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) throw new Error("Conversation introuvable");
    const me = await loadProfile(context.userId);
    if (!me) throw new Error("Profil introuvable");
    const sql = await getSql();
    // Blocage mutuel : plus de messages si l'un a bloqué l'autre.
    const blocked = await sql.query<{ id: number }>(
      `select id from blocks where
         (blocker_id = $1 and blocked_id = $2) or (blocker_id = $2 and blocked_id = $1)
       limit 1`,
      [context.userId, partnerId(m, context.userId)],
    );
    if (blocked.length) throw new Error("Conversation indisponible");
    if (containsPhoneNumber(body)) {
      throw new Error(
        "N'écris pas de numéro dans le chat. Utilise le bouton « Envoyer mon numéro ».",
      );
    }
    if (SCAM_HARD_PATTERN.test(body)) {
      throw new Error(
        "Ce message évoque un paiement ou une demande d'argent typique des arnaques. Pour ta sécurité, l'envoi est bloqué.",
      );
    }
    if (ABUSE_PATTERN.test(body)) {
      throw new Error("Ce message contient des insultes. Reformule avant d'envoyer.");
    }
    const ordered = await sql.query<{ id: number }>(
      "select id from matches where user_a = $1 or user_b = $1 order by created_at asc",
      [context.userId],
    );
    const idx = ordered.findIndex((r) => r.id === m.id);
    if (isLocked(idx, me.isPremium, me.bonusChats)) {
      throw new Error("Conversation verrouillée — passe en Prestige");
    }
    const last = await sql.query<{ sender_id: string; created_at: string }>(
      "select sender_id, created_at from messages where match_id = $1 order by created_at desc limit 1",
      [m.id],
    );
    if (last[0] && last[0].sender_id !== context.userId) {
      const withinDay =
        Date.now() - new Date(last[0].created_at).getTime() <= 24 * 60 * 60 * 1000;
      await sql.query(
        `update profiles set reply_total = reply_total + 1,
          reply_within_day = reply_within_day + $2 where user_id = $1`,
        [context.userId, withinDay ? 1 : 0],
      );
    }
    await sql.query(
      "insert into messages (match_id, sender_id, body, flagged) values ($1,$2,$3,$4)",
      // Termes ambigus (crypto, « besoin d'argent »…) : autorisés mais signalés aux modérateurs.
      [m.id, context.userId, body, SCAM_SOFT_PATTERN.test(body)],
    );
    const pid = partnerId(m, context.userId);
    const partner = await loadProfile(pid);
    if (partner?.isDemo) {
      const reply =
        DEMO_REPLIES[partner.userId] ??
        "Merci pour votre message. Racontez-moi un peu plus sur vous.";
      await sql.query(
        "insert into messages (match_id, sender_id, body) values ($1,$2,$3)",
        [m.id, partner.userId, reply],
      );
    }
    return { ok: true as const };
  });

export const sendVoiceMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number; audioUrl: string }) => input)
  .handler(async ({ context, data }) => {
    if (!data.audioUrl?.startsWith("data:audio/"))
      throw new Error("Audio invalide");
    if (data.audioUrl.length > MAX_AUDIO_DATA_URL_LENGTH)
      throw new Error("Message vocal trop long");
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) throw new Error("Conversation introuvable");
    const me = await loadProfile(context.userId);
    if (!me) throw new Error("Profil introuvable");
    const sql = await getSql();
    const ordered = await sql.query<{ id: number }>(
      "select id from matches where user_a = $1 or user_b = $1 order by created_at asc",
      [context.userId],
    );
    const idx = ordered.findIndex((r) => r.id === m.id);
    if (isLocked(idx, me.isPremium, me.bonusChats)) {
      throw new Error("Conversation verrouillée — passe en Prestige");
    }
    await sql.query(
      "insert into messages (match_id, sender_id, body, kind, audio_url) values ($1,$2,$3,'voice',$4)",
      [m.id, context.userId, "🎤 Message vocal", data.audioUrl],
    );
    return { ok: true as const };
  });

/**
 * Appel vidéo à consentement mutuel : comme requestContact/respondContact,
 * personne ne voit la salle d'appel avant que l'autre ait accepté. La salle
 * (Jitsi Meet, gratuit, sans clé API) est un nom aléatoire non devinable.
 */
export const requestCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number }) => input)
  .handler(async ({ context, data }) => {
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) throw new Error("no match");
    const sql = await getSql();
    const room = `rayine-${m.id}-${Math.random().toString(36).slice(2, 12)}`;
    await sql.query(
      "insert into call_requests (match_id, requester_id, status, room) values ($1,$2,'pending',$3)",
      [m.id, context.userId, room],
    );
    return { ok: true as const };
  });

export const respondCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number; accept: boolean }) => input)
  .handler(async ({ context, data }) => {
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) throw new Error("no match");
    const sql = await getSql();
    await sql.query(
      `update call_requests set status = $1
       where match_id = $2 and requester_id <> $3 and status = 'pending'`,
      [data.accept ? "accepted" : "declined", m.id, context.userId],
    );
    return { ok: true as const };
  });

export type CallState = {
  status: "none" | "pending" | "accepted" | "declined";
  mine: boolean;
  room: string | null;
};

export const getCallState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number }) => input)
  .handler(async ({ context, data }): Promise<CallState> => {
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) return { status: "none", mine: false, room: null };
    const sql = await getSql();
    const rows = await sql.query<{ requester_id: string; status: string; room: string }>(
      "select requester_id, status, room from call_requests where match_id = $1 order by created_at desc limit 1",
      [m.id],
    );
    const call = rows[0];
    if (!call) return { status: "none", mine: false, room: null };
    return {
      status: call.status as CallState["status"],
      mine: call.requester_id === context.userId,
      room: call.status === "accepted" ? call.room : null,
    };
  });

/**
 * Envoie le numéro renseigné à l'inscription dans le chat du match.
 * Côté client : double confirmation + alerte sur les risques.
 * Interdit d'écrire un numéro en texte libre (voir sendMessage).
 */
export const shareMyPhone = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number; confirmed: boolean }) => input)
  .handler(async ({ context, data }) => {
    if (!data.confirmed) throw new Error("Confirmation requise");
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) throw new Error("Conversation introuvable");
    const me = await loadProfile(context.userId);
    if (!me?.phone?.trim()) {
      throw new Error("Aucun numéro sur ton profil — ajoute-le dans Modifier le profil.");
    }
    const sql = await getSql();
    const pid = partnerId(m, context.userId);
    const blocked = await sql.query<{ id: number }>(
      `select id from blocks where
         (blocker_id = $1 and blocked_id = $2) or (blocker_id = $2 and blocked_id = $1)
       limit 1`,
      [context.userId, pid],
    );
    if (blocked.length) throw new Error("Conversation indisponible");
    // Délai de confiance : 72 h si les deux sont dans Love, 24 h sinon (voir trustRules).
    const partner = await loadProfile(pid);
    const rule = trustRules(me.universes, partner?.universes ?? []);
    const meta = await sql.query<{ created_at: string }>(
      "select created_at from matches where id = $1",
      [m.id],
    );
    if (meta[0]) {
      const ageHours =
        (Date.now() - new Date(meta[0].created_at).getTime()) / (60 * 60 * 1000);
      if (ageHours < rule.hours) {
        throw new Error(
          `Pour ta sécurité, le partage du numéro est possible après ${rule.hours} h de match (encore ~${Math.ceil(rule.hours - ageHours)} h).`,
        );
      }
    }
    const body = `📱 Mon numéro : ${me.phone.trim()}`;
    await sql.query(
      "insert into messages (match_id, sender_id, body, flagged) values ($1,$2,$3,false)",
      [m.id, context.userId, body],
    );
    return { ok: true as const };
  });

export const requestContact = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number }) => input)
  .handler(async ({ context, data }) => {
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) throw new Error("no match");
    const sql = await getSql();
    const me = await loadProfile(context.userId);
    const partner = await loadProfile(partnerId(m, context.userId));
    const rule = trustRules(me?.universes ?? [], partner?.universes ?? []);
    // Délai de confiance : âge du match + volume d'échanges minimum (plus strict dans Love).
    const meta = await sql.query<{ created_at: string; msg_count: number }>(
      `select m.created_at,
              (select count(*)::int from messages msg where msg.match_id = m.id) as msg_count
       from matches m where m.id = $1`,
      [m.id],
    );
    const row = meta[0];
    if (row) {
      const ageHours =
        (Date.now() - new Date(row.created_at).getTime()) / (60 * 60 * 1000);
      if (ageHours < rule.hours) {
        throw new Error(
          `Attends encore un peu avant de demander le contact (délai de confiance ${rule.hours} h).`,
        );
      }
      if (Number(row.msg_count) < rule.minMessages) {
        throw new Error(
          `Échangez au moins ${rule.minMessages} messages avant de demander le contact.`,
        );
      }
    }
    await sql.query(
      "insert into contact_requests (match_id, requester_id, status) values ($1,$2,'pending')",
      [m.id, context.userId],
    );
    return { ok: true as const };
  });

export const respondContact = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { matchId: number; accept: boolean }) => input)
  .handler(async ({ context, data }) => {
    const m = await matchAccess(data.matchId, context.userId);
    if (!m) throw new Error("no match");
    const sql = await getSql();
    await sql.query(
      `update contact_requests set status = $1
       where match_id = $2 and requester_id <> $3 and status = 'pending'`,
      [data.accept ? "accepted" : "declined", m.id, context.userId],
    );
    return { ok: true as const };
  });

/**
 * Active le statut Prestige.
 * Pour le lancement gratuit : activation immédiate sans paiement.
 * Plus tard : brancher Paystack / Stripe ici avant de passer is_premium = true.
 */
export const subscribePremium = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    // Soft rate-limit : un utilisateur ne peut pas spammer l'endpoint
    const recent = await sql.query<{ c: number }>(
      `select count(*)::int as c from profiles
       where user_id = $1 and is_premium = true and updated_at > now() - interval '1 minute'`,
      [context.userId],
    );
    if ((recent[0]?.c ?? 0) > 0) {
      return loadProfile(context.userId);
    }
    await sql.query(
      `update profiles set
         is_premium = true,
         premium_until = greatest(coalesce(premium_until, now()), now()) + interval '365 days',
         updated_at = now()
       where user_id = $1`,
      [context.userId],
    );
    return loadProfile(context.userId);
  });

export const grantBonusChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    // Limite les bonus gratuits (anti-abus simple)
    const me = await loadProfile(context.userId);
    if (me && me.bonusChats >= 10) {
      return me;
    }
    await sql.query(
      "update profiles set bonus_chats = bonus_chats + 1, updated_at = now() where user_id = $1",
      [context.userId],
    );
    return loadProfile(context.userId);
  });

export const reportProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; reason: string }) => input)
  .handler(async ({ context, data }) => {
    if (!data.userId || data.userId === context.userId) return { ok: true };
    const sql = await getSql();
    // Anti-spam : max 5 signalements par heure
    const recent = await sql.query<{ c: number }>(
      `select count(*)::int as c from reports
       where reporter_id = $1 and created_at > now() - interval '1 hour'`,
      [context.userId],
    );
    if ((recent[0]?.c ?? 0) >= 5) {
      return { ok: false as const, error: "too_many_reports" };
    }
    await sql.query(
      "insert into reports (reporter_id, reported_id, reason) values ($1,$2,$3)",
      [context.userId, data.userId, data.reason || "signalement"],
    );
    await sql.query(
      "insert into blocks (blocker_id, blocked_id, reason) values ($1,$2,$3) on conflict do nothing",
      [context.userId, data.userId, data.reason || "signalement"],
    );
    // Chaque signalement distinct entame la fiabilité ; sous le seuil, le
    // compte est suspendu automatiquement en attendant une revue humaine.
    const AUTO_SUSPEND_THRESHOLD = 40;
    const updated = await sql.query<{ reliability_score: number }>(
      `update profiles set reliability_score = greatest(0, reliability_score - 8), updated_at = now()
       where user_id = $1
       returning reliability_score`,
      [data.userId],
    );
    const score = updated[0]?.reliability_score;
    if (score !== undefined && score < AUTO_SUSPEND_THRESHOLD) {
      await sql.query(
        `update profiles set suspended = true, suspended_reason = $2
         where user_id = $1 and suspended = false`,
        [data.userId, "auto: signalements multiples"],
      );
    }
    return { ok: true as const };
  });

export const suggestIcebreaker = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; lang: string }) => input)
  .handler(async ({ context, data }) => {
    const me = await loadProfile(context.userId);
    const them = await loadProfile(data.userId);
    if (!me || !them) return { ok: false as const, text: "" };
    const fallback = fallbackIce(me, them, data.lang);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: true as const, text: fallback };
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 160,
          messages: [
            {
              role: "system",
              content:
                "You write one short, warm, non-flirty icebreaker for a serious dating/networking app named RAYINE. No emojis. No questions about appearance. One or two sentences max.",
            },
            {
              role: "user",
              content: `Language: ${data.lang}. Me: ${me.firstName}, ${me.city} ${me.country}, universes ${me.universes.join("+")}, bio: ${me.bio}. Them: ${them.firstName}, ${them.ageBand}, ${them.city} ${them.country}, ${them.universes.join("+")}, ${them.proDomain ?? ""}, bio: ${them.bio}.`,
            },
          ],
        }),
      });
      if (!res.ok) return { ok: true as const, text: fallback };
      const body = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      const text = body.choices[0]?.message.content?.trim() || fallback;
      return { ok: true as const, text };
    } catch {
      return { ok: true as const, text: fallback };
    }
  });

export const explainMatch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; lang: string }) => input)
  .handler(async ({ context, data }) => {
    const me = await loadProfile(context.userId);
    const them = await loadProfile(data.userId);
    if (!me || !them) return { ok: false as const, text: "", score: 0 };
    const score = compatibilityScore(me, them);
    const fallback = fallbackWhy(me, them, score, data.lang);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: true as const, text: fallback, score };
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 140,
          messages: [
            {
              role: "system",
              content:
                "Explain in 2 short sentences why two RAYINE profiles may get along. Calm, specific, no fluff, no emojis.",
            },
            {
              role: "user",
              content: `Language: ${data.lang}. Score ${score}%. Me: ${me.universes.join("+")}, ${me.city} ${me.country}, ${me.ageBand}, ${me.familyStatus}. Them: ${them.firstName}, ${them.universes.join("+")}, ${them.city} ${them.country}, ${them.ageBand}, bio: ${them.bio}`,
            },
          ],
        }),
      });
      if (!res.ok) return { ok: true as const, text: fallback, score };
      const body = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      const text = body.choices[0]?.message.content?.trim() || fallback;
      return { ok: true as const, text, score };
    } catch {
      return { ok: true as const, text: fallback, score };
    }
  });

const UNIVERSE_NAMES: Record<string, string> = {
  mariage: "Love",
  amitie: "Friends",
  professionnel: "Pro",
  voyage: "Travel",
  projets: "Projects",
};

function sharedUniverses(me: Profile, them: Profile): string[] {
  return them.universes.filter((u) => me.universes.includes(u));
}

function fallbackIce(me: Profile, them: Profile, lang: string): string {
  const shared = sharedUniverses(me, them);
  const focus = shared[0] ?? them.intention;
  const name = UNIVERSE_NAMES[focus] ?? focus;
  if (lang === "en") {
    if (focus === "professionnel" || focus === "projets") {
      return `Hello ${them.firstName} — your ${them.proDomain ?? "work"} background caught my eye. What are you most excited to build right now?`;
    }
    return `Hello ${them.firstName} — we both joined RAYINE ${name}. What does an ordinary good day look like in ${them.city}?`;
  }
  if (focus === "professionnel" || focus === "projets") {
    return `Bonjour ${them.firstName}, votre parcours côté ${them.proDomain ?? "pro"} m’a arrêté. Qu’est-ce qui vous anime le plus en ce moment ?`;
  }
  return `Bonjour ${them.firstName}, nous sommes tous deux dans RAYINE ${name} — ça me parle. Qu’est-ce qui vous a donné envie d’écrire ici ?`;
}

function fallbackWhy(
  me: Profile,
  them: Profile,
  score: number,
  lang: string,
): string {
  const shared = sharedUniverses(me, them);
  const names = shared.map((u) => UNIVERSE_NAMES[u] ?? u).join(" + ");
  if (lang === "en") {
    return shared.length
      ? `You share the RAYINE ${names} universe and a ${score}% fit. That is a solid place to start a sincere conversation.`
      : `Different paths, ${score}% fit — ${them.city} and a clear profile often matter more than identical checkboxes.`;
  }
  return shared.length
    ? `Même univers RAYINE ${names} et ${score} % d’affinité. Un bon socle pour une conversation sincère.`
    : `Chemins différents, ${score} % d’affinité — ${them.city} et un profil clair comptent souvent plus que des cases identiques.`;
}

/**
 * Coach de profil — conseils pour améliorer sa fiche. Toujours une base de
 * règles simples (fonctionne sans clé API) ; enrichi par l'IA xAI si
 * `XAI_API_KEY` est configurée, avec repli silencieux sinon.
 */
export const getProfileCoachTips = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { lang: string }) => input)
  .handler(async ({ context, data }) => {
    const me = await loadProfile(context.userId);
    if (!me) return { tips: [] as string[] };
    const fr = data.lang !== "en";
    const tips: string[] = [];
    if (me.bio.trim().length < 40)
      tips.push(
        fr
          ? "Ta présentation est courte — ajoute une anecdote ou ce que tu recherches vraiment, ça multiplie les réponses."
          : "Your bio is short — add a story or what you're really looking for, it drives far more replies.",
      );
    if (!me.profession)
      tips.push(
        fr
          ? "Indique ta profession : ça rassure et ouvre des sujets de conversation."
          : "Add your profession — it builds trust and gives people something to ask about.",
      );
    if (me.languages.length === 0)
      tips.push(
        fr
          ? "Ajoute les langues que tu parles — utile pour matcher au-delà de ton pays."
          : "Add the languages you speak — helpful for matching beyond your own country.",
      );
    if (me.verificationStatus !== "verifie")
      tips.push(
        fr
          ? "Fais vérifier ton profil par selfie (facultatif) : le badge rassure et augmente les réponses."
          : "Get selfie-verified (optional): the badge reassures people and boosts reply rates.",
      );
    if (!me.loveLanguage && !me.weekendStyle)
      tips.push(
        fr
          ? "Réponds au petit questionnaire de personnalité — ça affine tes suggestions de compatibilité."
          : "Fill in the short personality quiz — it sharpens your compatibility suggestions.",
      );

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || !me.bio.trim()) return { tips: tips.slice(0, 4) };
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 180,
          messages: [
            {
              role: "system",
              content:
                "You are a warm, direct dating-profile coach for the serious connection app RAYINE. Give at most 2 short, specific, actionable tips (no fluff, no emojis) to make this bio more attractive and trustworthy, in the requested language. One sentence each.",
            },
            {
              role: "user",
              content: `Language: ${data.lang}. Universes: ${me.universes.join("+")}. Bio: "${me.bio}".`,
            },
          ],
        }),
      });
      if (!res.ok) return { tips: tips.slice(0, 4) };
      const body = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      const aiTips = (body.choices[0]?.message.content ?? "")
        .split(/\n+/)
        .map((l) => l.replace(/^[-•\d.)\s]+/, "").trim())
        .filter(Boolean)
        .slice(0, 2);
      return { tips: [...aiTips, ...tips].slice(0, 4) };
    } catch {
      return { tips: tips.slice(0, 4) };
    }
  });
