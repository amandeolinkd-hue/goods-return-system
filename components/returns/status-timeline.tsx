import { PlusCircle, Truck, PackageCheck, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/utils";

type Step = { icon: LucideIcon; title: string; sub?: string; time?: string; done: boolean };

export function StatusTimeline({
  createdAt,
  createdByName,
  postedOn,
  status,
  receivedAt,
  receivedByName,
}: {
  createdAt: Date | string | null;
  createdByName: string | null;
  postedOn: string | null;
  status: "posted" | "received";
  receivedAt: Date | string | null;
  receivedByName: string | null;
}) {
  const steps: Step[] = [
    {
      icon: PlusCircle,
      title: "Entry created",
      sub: createdByName ? `by ${createdByName}` : undefined,
      time: formatDateTime(createdAt),
      done: true,
    },
    {
      icon: Truck,
      title: "Posted to Bhiwandi",
      time: postedOn ? formatDate(postedOn) : undefined,
      done: true,
    },
    status === "received"
      ? {
          icon: PackageCheck,
          title: "Received at Bhiwandi",
          sub: receivedByName ? `by ${receivedByName}` : undefined,
          time: formatDateTime(receivedAt),
          done: true,
        }
      : { icon: Clock, title: "Awaiting receipt", done: false },
  ];

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:gap-0">
      {steps.map((s, i) => (
        <li key={i} className="relative flex flex-1 gap-3 sm:flex-col sm:gap-2 pb-6 sm:pb-0">
          <div className="flex flex-col items-center sm:flex-row sm:w-full">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                s.done ? "bg-brand-gradient text-white" : "bg-muted text-muted-foreground"
              )}
            >
              <s.icon className="h-4 w-4" />
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-px flex-1 sm:h-px sm:w-full",
                  steps[i + 1].done ? "bg-primary/40" : "bg-border"
                )}
              />
            )}
          </div>
          <div className="pb-2 sm:pb-0">
            <div className="text-sm font-medium leading-tight">{s.title}</div>
            {s.time && <div className="text-xs text-muted-foreground">{s.time}</div>}
            {s.sub && <div className="text-xs text-muted-foreground">{s.sub}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
