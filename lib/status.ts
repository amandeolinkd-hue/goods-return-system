// The DB stores "posted" for a return that is still awaiting receipt at
// Bhiwandi. Business-facing wording (matching the old sheet) is "Pending".
export type ReturnStatus = "posted" | "received";

export const STATUS_LABELS: Record<ReturnStatus, string> = {
  posted: "Pending",
  received: "Received",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as ReturnStatus] ?? status;
}
