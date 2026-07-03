import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { getReturnsList } from "@/lib/returns-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ReceiveAction } from "@/components/returns/receive-action";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Receiving · Goods Return System" };

export default async function ReceivingPage() {
  await requireRole("admin", "bhiwandi");
  const list = await getReturnsList({ status: "posted", pageSize: 100 });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Receiving Queue"
        description={`${list.total} return${list.total === 1 ? "" : "s"} awaiting confirmation at Bhiwandi.`}
      />

      <Card>
        <CardContent className="px-0 py-0">
          <Table>
            <THead>
              <TR>
                <TH className="pl-6">LD Id</TH>
                <TH>Date</TH>
                <TH>Party</TH>
                <TH>Broker</TH>
                <TH>Lines</TH>
                <TH>Reason</TH>
                <TH className="text-right">Total</TH>
                <TH className="pr-6">Action</TH>
              </TR>
            </THead>
            <TBody>
              {list.rows.length === 0 ? (
                <TR>
                  <TD className="pl-6 py-8 text-muted-foreground" colSpan={8}>
                    Nothing to receive — all posted returns have been confirmed.
                  </TD>
                </TR>
              ) : (
                list.rows.map((r) => (
                  <TR key={r.id}>
                    <TD className="pl-6 font-medium">
                      <Link href={`/returns/${r.id}`} className="text-primary hover:underline">
                        {r.displayId}
                      </Link>
                    </TD>
                    <TD>{formatDate(r.dated)}</TD>
                    <TD>{r.partyName ?? "-"}</TD>
                    <TD className="text-muted-foreground">{r.brokerName ?? "-"}</TD>
                    <TD>{r.itemCount}</TD>
                    <TD className="text-muted-foreground">{r.returnReason}</TD>
                    <TD className="text-right tabular-nums">{formatINR(r.totalValue)}</TD>
                    <TD className="pr-6">
                      <ReceiveAction returnId={r.id} displayId={r.displayId} />
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
