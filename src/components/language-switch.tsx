import { LANGS } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  fr: "FR",
  en: "EN",
  ar: "ع",
  es: "ES",
  pt: "PT",
};

export function LanguageSwitch({ compact }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className="flex items-center gap-1" role="group" aria-label={t("lang")}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={cn(
            "h-8 min-w-8 rounded-full px-2 text-[11px] font-medium tracking-wide transition-colors",
            lang === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            compact && "h-7 min-w-7 px-1.5",
          )}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
