import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/status";

export function StatusBadge({ status }: { status: "posted" | "received" }) {
  return status === "received" ? (
    <Badge tone="success" dot>
      {STATUS_LABELS.received}
    </Badge>
  ) : (
    <Badge tone="warning" dot>
      {STATUS_LABELS.posted}
    </Badge>
  );
}
