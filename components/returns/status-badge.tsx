import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: "posted" | "received" }) {
  return status === "received" ? (
    <Badge tone="success" dot>
      Received
    </Badge>
  ) : (
    <Badge tone="warning" dot>
      Posted
    </Badge>
  );
}
