import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeSwitch } from "@/components/theme-switch";
import { Wordmark } from "@/components/wordmark";
import {
  DIAL_CODES,
  PENDING_PHONE_KEY,
  phoneToAuthEmail,
  toE164,
  flagEmoji,
} from "@/lib/phone-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({ component: Login });

type Mode = "in" | "up";
type Method = "email" | "phone";

function Login() {
  const { user, isPending } = useCurrentUserState();
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>("in");
  const [method, setMethod] = useState<Method>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dial, setDial] = useState("+225");
  const [phoneNational, setPhoneNational] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="h-10 w-40 animate-pulse rounded-full bg-secondary" />
      </main>
    );
  }
  if (user) return <Navigate to="/" />;

  const resolveAuthEmail = (): string | null => {
    if (method === "email") {
      const e = email.trim().toLowerCase();
      return e.includes("@") ? e : null;
    }
    const e164 = toE164(dial, phoneNational);
    if (!e164) return null;
    return phoneToAuthEmail(e164);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("minPassword"));
      return;
    }
    const authEmail = resolveAuthEmail();
    if (!authEmail) {
      setError(method === "phone" ? t("invalidPhone") : t("authError"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "up") {
        const displayName =
          name.trim() ||
          (method === "phone" ? `${dial} ${phoneNational}`.trim() : email);
        const { error: err } = await authClient.signUp.email({
          email: authEmail,
          password,
          name: displayName,
        });
        if (err) throw new Error(err.message);
        if (method === "phone") {
          const e164 = toE164(dial, phoneNational);
          if (e164) {
            try {
              sessionStorage.setItem(PENDING_PHONE_KEY, e164);
            } catch {
              /* ignore */
            }
          }
        }
      } else {
        const { error: err } = await authClient.signIn.email({
          email: authEmail,
          password,
        });
        if (err) throw new Error(err.message);
      }
      window.location.href = "/";
    } catch {
      setError(t("authError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-2 flex flex-col items-end gap-1.5">
        <LanguageSwitch compact />
        <ThemeSwitch compact />
      </div>

      <div className="mb-10 flex justify-center">
        <Wordmark variant="auth" />
      </div>

      {!authEnabled && (
        <p className="mb-6 text-sm text-muted-foreground">Sign-in is disabled.</p>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-secondary/60 p-1">
        <button
          type="button"
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition-colors",
            method === "email"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setMethod("email")}
        >
          {t("email")}
        </button>
        <button
          type="button"
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition-colors",
            method === "phone"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setMethod("phone")}
        >
          {t("authPhone")}
        </button>
      </div>

      <form className="space-y-3" onSubmit={submit}>
        {mode === "up" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
        )}

        {method === "email" ? (
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("authPhone")}</Label>
            <div className="flex gap-2">
              <select
                id="dial"
                className="h-10 max-w-[9.5rem] shrink-0 rounded-md border border-input bg-background px-2 text-sm"
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                aria-label={t("countryCode")}
              >
                {DIAL_CODES.map((c) => (
                  <option key={`${c.iso}-${c.dial}`} value={c.dial}>
                    {flagEmoji(c.iso)} {c.dial} {c.iso}
                  </option>
                ))}
              </select>
              <Input
                id="phone"
                type="tel"
                required
                value={phoneNational}
                onChange={(e) => setPhoneNational(e.target.value)}
                autoComplete="tel-national"
                inputMode="numeric"
                placeholder={t("phonePlaceholder")}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("phoneAuthHint")}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "up" ? t("signUp") : t("signIn")}
        </Button>
      </form>

      <button
        type="button"
        className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => setMode(mode === "up" ? "in" : "up")}
      >
        {mode === "up" ? t("hasAccount") : t("noAccount")}
      </button>
    </main>
  );
}
