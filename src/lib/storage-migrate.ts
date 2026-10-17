const LEGACY_KEYS: Record<string, string> = {
  "as:ref": "rayine:ref",
  "as:install-dismissed": "rayine:install-dismissed",
  "aura.lang": "rayine.lang",
  "nayora:ref": "rayine:ref",
  "nayora:install-dismissed": "rayine:install-dismissed",
  "nayora.lang": "rayine.lang",
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
  } catch {
    /* ignore */
  }
}
