import Link from "next/link";
import { cn } from "@/lib/utils";

export type TabItem = { label: string; href: string; active: boolean; count?: number };

export function Tabs({ items }: { items: TabItem[] }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
        {items.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:px-3.5",
              t.active
                ? "bg-brand-gradient text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                  t.active ? "bg-white/20" : "bg-muted-foreground/15"
                )}
              >
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
