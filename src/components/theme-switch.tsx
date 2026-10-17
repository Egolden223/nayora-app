import { Moon, Sun } from "lucide-react";
import { useLang } from "@/lib/lang";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const LABELS: Record<string, { theme: string; light: string; dark: string }> = {
  fr: { theme: "Thème", light: "Clair", dark: "Sombre" },
  en: { theme: "Theme", light: "Light", dark: "Dark" },
  ar: { theme: "المظهر", light: "فاتح", dark: "داكن" },
  es: { theme: "Tema", light: "Claro", dark: "Oscuro" },
  pt: { theme: "Tema", light: "Claro", dark: "Escuro" },
};

export function ThemeSwitch({ compact }: { compact?: boolean }) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { lang, t } = useLang();
  const L = LABELS[lang] ?? LABELS.fr;
  const labelTheme = t("theme") !== "theme" ? t("theme") : L.theme;

  if (compact) {
    const next = theme === "dark" ? L.light : L.dark;
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`${labelTheme}: ${next}`}
        title={`${labelTheme}: ${next}`}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary",
          "outline-none focus:ring-2 focus:ring-primary/40",
        )}
      >
        {theme === "light" ? (
          <Sun className="size-4" strokeWidth={2} aria-hidden />
        ) : (
          <Moon className="size-4" strokeWidth={2} aria-hidden />
        )}
      </button>
    );
  }

  return (
    <label className="relative inline-flex min-w-[10rem] items-center">
      <span className="sr-only">{labelTheme}</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as "light" | "dark")}
        aria-label={labelTheme}
        className={cn(
          "h-10 w-full appearance-none rounded-full border border-border bg-card pl-9 pr-8 text-sm text-foreground outline-none",
          "focus:ring-2 focus:ring-primary/40",
        )}
      >
        <option value="dark">{L.dark}</option>
        <option value="light">{L.light}</option>
      </select>
      {theme === "light" ? (
        <Sun className="pointer-events-none absolute left-3 size-4 text-primary" strokeWidth={2} aria-hidden />
      ) : (
        <Moon className="pointer-events-none absolute left-3 size-4 text-primary" strokeWidth={2} aria-hidden />
      )}
    </label>
  );
}
