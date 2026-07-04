import Link from "next/link";
import { StatusBadge } from "@/components/returns/status-badge";
import { formatDate, formatINR } from "@/lib/utils";
import type { ReturnListRow } from "@/lib/returns-query";

/** Stacked card list shown on small screens in place of a wide table. */
export function ReturnMobileList({
  rows,
  renderAction,
}: {
  rows: ReturnListRow[];
  renderAction?: (r: ReturnListRow) => React.ReactNode;
}) {
  return (
    <div className="divide-y divide-border sm:hidden">
      {rows.map((r) => (
        <div key={r.id} className="px-4 py-3.5">
          <Link href={`/returns/${r.id}`} className="block">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-primary">{r.displayId}</span>
              <StatusBadge status={r.status} />
            </div>
            <div className="mt-1 truncate text-sm font-medium">{r.partyName ?? "-"}</div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {formatDate(r.dated)} · {r.itemCount} line{r.itemCount === 1 ? "" : "s"}
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatINR(r.totalValue)}
              </span>
            </div>
          </Link>
          {renderAction && <div className="mt-3">{renderAction(r)}</div>}
        </div>
      ))}
    </div>
  );
}
