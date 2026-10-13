import { LANGS } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

/** Libellés longs (menu étendu). */
const LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
  es: "Español",
  pt: "Português",
};

/** Abréviations compactes pour le header mobile. */
const SHORT: Record<string, string> = {
  fr: "FR",
  en: "EN",
  ar: "AR",
  es: "ES",
  pt: "PT",
};

export function LanguageSwitch({ compact }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (
    <label
      className={cn(
        "relative inline-flex items-center",
        compact ? "min-w-[3.25rem]" : "min-w-[10rem]",
      )}
    >
      <span className="sr-only">{t("lang")}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as typeof lang)}
        aria-label={t("lang")}
        className={cn(
          "w-full appearance-none rounded-full border border-border bg-card text-foreground outline-none",
          "focus:ring-2 focus:ring-primary/40",
          compact ? "h-9 pl-2.5 pr-6 text-xs font-semibold tracking-wide" : "h-10 pl-3.5 pr-8 text-sm",
        )}
      >
        {LANGS.map((code) => (
          <option key={code} value={code}>
            {compact ? (SHORT[code] ?? code.toUpperCase()) : (LABELS[code] ?? code.toUpperCase())}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute text-muted-foreground",
          compact ? "right-1.5 size-3" : "right-2.5 size-3.5",
        )}
        strokeWidth={2}
        aria-hidden
      />
    </label>
  );
}
