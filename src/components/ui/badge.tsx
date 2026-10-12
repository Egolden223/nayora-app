import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "primary" | "ok";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tone === "primary" && "bg-accent text-accent-foreground",
        tone === "muted" && "bg-secondary text-muted-foreground",
        tone === "ok" && "bg-secondary text-foreground",
        className,
      )}
      {...props}
    />
  );
}
