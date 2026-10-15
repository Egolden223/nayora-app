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
  firstName: string;
  ageBand: string;
  birthDate?: string | null;
  gender: string;
  lookingFor: string;
  city: string;
  country: string;
  familyStatus: string;
  intention: string;
  universes: string[];
  universeData: UniverseData;
  proDomain: string | null;
  bio: string;
  phone: string | null;
  isPremium: boolean;
  premiumUntil: string | null;
  premiumDaysLeft: number;
  bonusChats: number;
  verificationStatus: string;
  idDocumentStatus: string;
  phoneVerified: boolean;
  reliabilityScore: number;
  charterAccepted: boolean;
  isDemo: boolean;
  suspended: boolean;
  photoUrl: string | null;
  photoBlurUrl: string | null;
  blurPhotos: boolean;
  photoHidden: boolean;
  meetCount: number;
  meetRating: number | null;
  tripReviewCount: number;
  tripRating: number | null;
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

// TEMPORARY STUB - full file restore needed
export async function loadProfile(userId: string) { return null; }
export const getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async () => null);
export const subscribePremium = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
  const sql = await getSql();
  await sql.query(`update profiles set is_premium = true, premium_until = greatest(coalesce(premium_until, now()), now()) + interval '365 days', updated_at = now() where user_id = $1`, [context.userId]);
  return null;
});
