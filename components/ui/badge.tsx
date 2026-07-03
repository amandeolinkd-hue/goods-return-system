import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "info" | "muted";

const tones: Record<Tone, string> = {
  default: "bg-secondary text-secondary-foreground ring-border",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/12 text-warning ring-warning/25",
  info: "bg-accent text-accent-foreground ring-accent-foreground/15",
  muted: "bg-muted text-muted-foreground ring-border",
};

const dotTone: Record<Tone, string> = {
  default: "bg-slate-400",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-accent-foreground",
  muted: "bg-slate-400",
};

export function Badge({
  className,
  tone = "default",
  dot = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotTone[tone])} />}
      {children}
    </span>
  );
}
