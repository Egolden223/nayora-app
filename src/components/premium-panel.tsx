import { useState } from "react";
import type { Profile } from "@/lib/dating";
import { grantBonusChat, subscribePremium } from "@/lib/dating";
import { useLang } from "@/lib/lang";
import { formatPriceBreakdown } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { MatchmakerSection } from "@/components/matchmaker-panel";
import { cn } from "@/lib/utils";

export function PremiumPanel({
  me,
  onDone,
}: {
  me: Profile;
  onDone: () => void;
}) {
  const { t } = useLang();
  const priceBreakdown = formatPriceBreakdown(me.country);
  const [watching, setWatching] = useState(false);
  const [activating, setActivating] = useState(false);
  const [method, setMethod] = useState<"orange" | "paypal">("orange");

  return (
    <div className="page-panel page-panel-top text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">Prestige</p>
      <h1 className="mt-2 font-display text-4xl font-medium">{t("premiumTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("premiumLead")}</p>
      <ul className="mt-8 space-y-3 text-left text-sm">
        {[t("premiumChat"), t("premiumBoost"), t("premiumBadge"), t("premiumAds")].map((line) => (
          <li key={line} className="rounded-2xl border border-border bg-card px-4 py-3">
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-8 font-display text-4xl tabular-nums">
        {priceBreakdown.primary}
        <span className="ml-2 font-sans text-sm text-muted-foreground">{t("perYear")}</span>
      </p>
      {priceBreakdown.lines.length > 1 && (
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          {priceBreakdown.lines.slice(1).join("  ·  ")}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{t("transparentPricing")}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{t("priceAlsoIn")}</p>
      {!me.isPremium && (
        <div className="mt-6 text-left">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {t("paymentMethod")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("orange")}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                method === "orange"
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {t("payOrange")}
            </button>
            <button
              type="button"
              onClick={() => setMethod("paypal")}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                method === "paypal"
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {t("payPaypal")}
            </button>
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{t("premiumLaunchNote")}</p>
      {me.isPremium ? (
        <p className="mt-6 text-sm text-primary">{t("subscribed")}</p>
      ) : (
        <Button
          className="mt-6 w-full"
          disabled={activating}
          onClick={async () => {
            setActivating(true);
            try {
              await subscribePremium();
              onDone();
            } finally {
              setActivating(false);
            }
          }}
        >
          {activating ? t("loading") : t("subscribeLaunch")}
        </Button>
      )}
      {!me.isPremium && (
        <Button
          variant="ghost"
          className="mt-3"
          disabled={watching}
          onClick={async () => {
            setWatching(true);
            await new Promise((r) => setTimeout(r, 1600));
            await grantBonusChat();
            setWatching(false);
            onDone();
          }}
        >
          {watching ? t("loading") : t("watchAd")}
        </Button>
      )}
      <MatchmakerSection isPremium={me.isPremium} />
    </div>
  );
}
