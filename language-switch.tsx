import { LANGS } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
  es: "Español",
  pt: "Português",
};

export function LanguageSwitch({ compact }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (
    <label
      className={cn(
        "relative inline-flex items-center",
        compact ? "min-w-[7.5rem]" : "min-w-[10rem]",
      )}
    >
      <span className="sr-only">{t("lang")}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as typeof lang)}
        aria-label={t("lang")}
        className={cn(
          "w-full appearance-none rounded-full border border-border bg-card text-foreground outline-none",
          "focus:ring-2 focus:ring-primary/40 pr-8",
          compact ? "h-9 px-3 text-xs" : "h-10 px-3.5 text-sm",
        )}
      >
        {LANGS.map((code) => (
          <option key={code} value={code}>
            {LABELS[code] ?? code.toUpperCase()}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground"
        strokeWidth={2}
        aria-hidden
      />
    </label>
  );
}
