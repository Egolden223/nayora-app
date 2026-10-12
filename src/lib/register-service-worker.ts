import { useEffect } from "react";

export function useRegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Best-effort: failed registration just means no offline shell
    });
  }, []);
}
