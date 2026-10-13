/** Re-export du module complet + médias chat + appels audio/vidéo. */
export * from "./dating_final";
export { sendImageMessage } from "./dating_media";
export { requestCall, getCallState } from "./dating_calls";
export type { CallState } from "./dating_calls";

import type { DiscoverFilters as BaseDiscoverFilters } from "./dating_final";

/** Filtres Discover étendus (Love). */
export type DiscoverFilters = BaseDiscoverFilters & {
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  religion?: string;
  city?: string;
};
