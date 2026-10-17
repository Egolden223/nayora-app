const LEGACY_KEYS: Record<string, string> = {
  "as:ref": "rayine:ref",
  "as:install-dismissed": "rayine:install-dismissed",
  "aura.lang": "rayine.lang",
  "nayora:ref": "rayine:ref",
  "nayora:install-dismissed": "rayine:install-dismissed",
  "nayora.lang": "rayine.lang",
  "nayora.theme": "rayine.theme",
  "nayora_pending_phone": "rayine_pending_phone",
};

export function migrateLegacyStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const [oldKey, newKey] of Object.entries(LEGACY_KEYS)) {
      const old = window.localStorage.getItem(oldKey);
      if (old === null) continue;
      if (window.localStorage.getItem(newKey) === null) {
        window.localStorage.setItem(newKey, old);
      }
      window.localStorage.removeItem(oldKey);
    }
    // sessionStorage pending phone
    const sp = window.sessionStorage.getItem("nayora_pending_phone");
    if (sp !== null && window.sessionStorage.getItem("rayine_pending_phone") === null) {
      window.sessionStorage.setItem("rayine_pending_phone", sp);
      window.sessionStorage.removeItem("nayora_pending_phone");
    }
    // migrate likeNote keys
    const toMove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("nayora:likeNote:")) toMove.push(k);
    }
    for (const k of toMove) {
      const nk = "rayine:likeNote:" + k.slice("nayora:likeNote:".length);
      if (window.localStorage.getItem(nk) === null) {
        window.localStorage.setItem(nk, window.localStorage.getItem(k)!);
      }
      window.localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
