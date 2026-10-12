import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FieldSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "flex h-11 w-full appearance-none rounded-xl border border-input bg-secondary px-3.5 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </select>
  );
}
