import type { ReactNode } from "react";

/** Auth provider shell — Better Auth client is used directly via hooks. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
