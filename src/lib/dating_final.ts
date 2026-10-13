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

// TEMPORARY RESTORE MARKER - full file follows in next commits if truncated
export * from "./dating_final_backup";
