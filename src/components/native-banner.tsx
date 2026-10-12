import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";

export function NativeBanner({
  premium,
  onCta,
}: {
  premium: boolean;
  onCta: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {t("sponsored")}
        </p>
        <p className="mt-0.5 truncate text-sm">
          {premium ? t("sponsorPremium") : t("sponsorFree")}
        </p>
      </div>
      <Button size="sm" variant={premium ? "outline" : "default"} onClick={onCta}>
        {t("goPremium")}
      </Button>
    </div>
  );
}
