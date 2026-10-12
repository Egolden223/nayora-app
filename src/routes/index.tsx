import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { upsertProfile } from "@/lib/dating";
import { HomeShell, useProfileLoader } from "@/components/home-shell";
import { Onboarding } from "@/components/onboarding";
import { Wordmark } from "@/components/wordmark";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  const { me, reload } = useProfileLoader(!!user && !isPending);
  const [editing, setEditing] = useState(false);

  // Session still resolving — show splash
  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-4">
          <Wordmark markClassName="text-4xl" />
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-1/2 animate-pulse bg-primary" />
          </div>
        </div>
      </main>
    );
  }

  // Not signed in — go to login (do NOT wait on profile)
  if (!user) return <RedirectToSignIn />;

  // Signed in but profile still loading
  if (me === undefined) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-4">
          <Wordmark markClassName="text-4xl" />
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-1/2 animate-pulse bg-primary" />
          </div>
        </div>
      </main>
    );
  }

  if (!me) {
    return (
      <Onboarding
        onSave={async (data) => {
          await upsertProfile({ data });
          await reload();
        }}
      />
    );
  }

  if (me.suspended) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Wordmark markClassName="text-4xl" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Votre compte a été suspendu par la modération. Si vous pensez
            qu'il s'agit d'une erreur, contactez le support.
          </p>
        </div>
      </main>
    );
  }

  return (
    <HomeShell
      me={me}
      onReloadMe={reload}
      editing={editing}
      setEditing={setEditing}
    />
  );
}
