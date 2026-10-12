const LEGACY_KEYS: Record<string, string> = {
  "as:ref": "nayora:ref",
  "as:install-dismissed": "nayora:install-dismissed",
  "aura.lang": "nayora.lang",
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
