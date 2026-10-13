/** Re-export du module complet + médias chat + appels audio/vidéo. */
export * from "./dating_final";
export { sendImageMessage } from "./dating_media";
export { requestCall, getCallState } from "./dating_calls";
export type { CallState } from "./dating_calls";

// Note: ageMin/ageMax/heightMin/religion/city sont acceptés côté UI (FilterSheet).
// Le serveur les lira dès la prochaine mise à jour de listDiscover.
