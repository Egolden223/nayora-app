import { createAuthClient } from "better-auth/react";
import { runSignOut } from "../../../scripts/sign-out-plan.mjs";

export const authClient = createAuthClient();

export const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";

export async function signOut(redirectTo = "/"): Promise<void> {
  await runSignOut({
    livePreview: false,
    hasBearer: false,
    requestSignOut: async () => {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message ?? "Sign-out failed");
    },
    clearToken: () => {},
    redirect: () => {
      window.location.href = redirectTo;
    },
  });
}
