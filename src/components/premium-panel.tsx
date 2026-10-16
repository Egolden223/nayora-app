import { useState } from "react";
import type { Profile } from "@/lib/dating";
import { grantBonusChat, subscribePremium } from "@/lib/dating";
import { useLang } from "@/lib/lang";
import { formatPriceBreakdown } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { MatchmakerSection } from "@/components/matchmaker-panel";
import { cn } from "@/lib/utils";
import { Crown, MessageCircle, Sparkles, BadgeCheck, EyeOff } from "lucide-react";

export function PremiumPanel({
  me,
  onDone,
}: {
  me: Profile;
  onDone: () => void;
}) {
  const { t } = useLang();
  const price = formatPriceBreakdown(me.country);
  const [watching, setWatching] = useState(false);
  const [activating, setActivating] = useState(false);
  const [method, setMethod] = useState<"orange" | "paypal">("orange");

  const daysLeft = me.premiumDaysLeft ?? 0;
  const benefits = [
    { icon: MessageCircle, text: t("premiumChat") },
    { icon: Sparkles, text: t("premiumBoost") },
    { icon: BadgeCheck, text: t("premiumBadge") },
    { icon: EyeOff, text: t("premiumAds") },
  ];

  return (
    <div className="page-panel page-panel-top text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Prestige</p>
      <h1 className="mt-2 font-display text-4xl font-medium">{t("premiumTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("premiumLead")}</p>

      {me.isPremium ? (
        <>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Crown className="size-4" />
            {t("subscribed")}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t("premiumActiveLead")}</p>

          <ul className="mt-6 space-y-3 text-left text-sm leading-relaxed">
            {benefits.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <MatchmakerSection isPremium={me.isPremium} />

          <div className="mt-8 rounded-2xl border border-border bg-card px-5 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("premiumRemaining")}
            </p>
            <p className="mt-1 font-display text-3xl tabular-nums tracking-tight text-foreground">
              {daysLeft > 0
                ? `${daysLeft} ${daysLeft === 1 ? t("dayLeft") : t("daysLeft")}`
                : t("premiumUnlimited")}
            </p>
          </div>
        </>
      ) : (
        <>
          <ul className="mt-8 space-y-3 text-left text-sm leading-relaxed">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-5">
            <p className="font-display text-4xl tabular-nums tracking-tight text-foreground">
              {price.primary}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("perYear")}</p>
            {(price.usd !== price.primary || price.eur !== price.primary) && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {price.usd !== price.primary && (
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs tabular-nums text-muted-foreground">
                    {price.usd}
                  </span>
                )}
                {price.eur !== price.primary && (
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs tabular-nums text-muted-foreground">
                    {price.eur}
                  </span>
                )}
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {t("transparentPricing")}
            </p>
          </div>

          <div className="mt-6 text-left">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("paymentMethod")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod("orange")}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-sm transition-colors",
                  method === "orange"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                Orange Money
              </button>
              <button
                type="button"
                onClick={() => setMethod("paypal")}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-sm transition-colors",
                  method === "paypal"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                PayPal
              </button>
            </div>
          </div>

          <Button
            className="mt-6 w-full"
            disabled={activating}
            onClick={async () => {
              setActivating(true);
              try {
                await subscribePremium({ data: { method } });
                onDone();
              } finally {
                setActivating(false);
              }
            }}
          >
            {activating ? "…" : t("subscribe")}
          </Button>

          <button
            type="button"
            className="mt-3 text-xs text-muted-foreground underline"
            onClick={async () => {
              if (watching) return;
              setWatching(true);
              try {
                await grantBonusChat();
                onDone();
              } finally {
                setWatching(false);
              }
            }}
          >
            {t("watchAdForChat")}
          </button>

          <MatchmakerSection isPremium={false} />
        </>
      )}
    </div>
  );
}
