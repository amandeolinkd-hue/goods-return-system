import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "primary" | "warning" | "success" | "muted";

const toneChip: Record<Tone, string> = {
  primary: "bg-accent text-accent-foreground",
  warning: "bg-warning/12 text-warning",
  success: "bg-success/10 text-success",
  muted: "bg-muted text-muted-foreground",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{value}</div>
          {hint && <div className="mt-0.5 text-xs text-muted-foreground truncate">{hint}</div>}
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneChip[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
