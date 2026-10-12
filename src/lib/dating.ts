import {
  loveDealbreaker,
  loveReasons,
  parseUniverseData,
  sanitizeUniverseData,
  scoreUniverse,
  travelIncompatible,
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

// TEMPORARY STUB - will be replaced
export type Profile = any;
export type ProfileInput = any;
export type DiscoverCard = any;
export type MatchRow = any;
export type ChatMessage = any;
export type ImpactStory = any;
export function maskPhoto(p: any) { return p; }
export async function loadProfile(userId: string) { return null; }
export const getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async () => null);
export const upsertProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async () => { throw new Error("dating.ts incomplete - redeploying"); });
