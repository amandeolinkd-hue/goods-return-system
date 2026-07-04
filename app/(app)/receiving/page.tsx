import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { getReturnsList, getReturnStats } from "@/lib/returns-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ReceiveAction } from "@/components/returns/receive-action";
import { ReturnMobileList } from "@/components/returns/return-mobile-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox, PackageCheck } from "lucide-react";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";

export const metadata = { title: "Receiving · Goods Return System" };

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

export default async function ReceivingPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireRole("admin", "bhiwandi");
  const sp = await searchParams;
  const tab = str(sp.tab) === "received" ? "received" : "pending";

  const [stats, list] = await Promise.all([
    getReturnStats(),
    getReturnsList({ status: tab === "received" ? "received" : "posted", pageSize: 200 }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Receiving"
        description="Goods coming in to the Bhiwandi office."
      />

      <Tabs
        items={[
          { label: "Pending", href: "/receiving?tab=pending", active: tab === "pending", count: stats.posted },
          { label: "Received", href: "/receiving?tab=received", active: tab === "received", count: stats.received },
        ]}
      />

      <Card>
        <CardContent className="px-0 py-0">
          {list.rows.length === 0 ? (
            <EmptyState
              icon={tab === "pending" ? Inbox : PackageCheck}
              title={tab === "pending" ? "Nothing pending" : "No received returns yet"}
              description={
                tab === "pending"
                  ? "All posted returns have been received."
                  : "Confirmed receipts will appear here."
              }
            />
          ) : tab === "pending" ? (
            <>
              <ReturnMobileList
                rows={list.rows}
                renderAction={(r) => <ReceiveAction returnId={r.id} displayId={r.displayId} />}
              />
              <div className="hidden sm:block">
                <Table>
                  <THead>
                    <TR>
                      <TH className="pl-6">LD Id</TH>
                      <TH>Date</TH>
                      <TH>Party</TH>
                      <TH className="hidden lg:table-cell">Broker</TH>
                      <TH className="hidden lg:table-cell">Lines</TH>
                      <TH className="hidden md:table-cell">Reason</TH>
                      <TH className="text-right">Total</TH>
                      <TH className="pr-6">Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {list.rows.map((r) => (
                      <TR key={r.id}>
                        <TD className="pl-6 font-medium">
                          <Link href={`/returns/${r.id}`} className="text-primary hover:underline">
                            {r.displayId}
                          </Link>
                        </TD>
                        <TD>{formatDate(r.dated)}</TD>
                        <TD>{r.partyName ?? "-"}</TD>
                        <TD className="hidden lg:table-cell text-muted-foreground">{r.brokerName ?? "-"}</TD>
                        <TD className="hidden lg:table-cell">{r.itemCount}</TD>
                        <TD className="hidden md:table-cell text-muted-foreground">{r.returnReason}</TD>
                        <TD className="text-right tabular-nums">{formatINR(r.totalValue)}</TD>
                        <TD className="pr-6">
                          <ReceiveAction returnId={r.id} displayId={r.displayId} />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </>
          ) : (
            <>
              <ReturnMobileList rows={list.rows} />
              <div className="hidden sm:block">
                <Table>
                  <THead>
                    <TR>
                      <TH className="pl-6">LD Id</TH>
                      <TH>Date</TH>
                      <TH>Party</TH>
                      <TH>Received On</TH>
                      <TH className="hidden lg:table-cell text-right">Transport (Balasaheb)</TH>
                      <TH className="text-right">Bhiwandi Charges</TH>
                      <TH className="pr-6" />
                    </TR>
                  </THead>
                  <TBody>
                    {list.rows.map((r) => (
                      <TR key={r.id}>
                        <TD className="pl-6 font-medium">
                          <Link href={`/returns/${r.id}`} className="text-primary hover:underline">
                            {r.displayId}
                          </Link>
                        </TD>
                        <TD>{formatDate(r.dated)}</TD>
                        <TD>{r.partyName ?? "-"}</TD>
                        <TD className="text-muted-foreground">{formatDateTime(r.receivedAt)}</TD>
                        <TD className="hidden lg:table-cell text-right tabular-nums text-muted-foreground">
                          {formatINR(r.bhiwandiTransportValue)}
                        </TD>
                        <TD className="text-right tabular-nums">{formatINR(r.bhiwandiCharges)}</TD>
                        <TD className="pr-6 text-right">
                          <Link href={`/returns/${r.id}`} className="text-sm text-primary hover:underline">
                            View
                          </Link>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {list.total > list.rows.length && (
        <p className="text-sm text-muted-foreground">
          Showing {list.rows.length} of {list.total}. Use{" "}
          <Link href="/returns?status=received" className="text-primary hover:underline">
            All Returns
          </Link>{" "}
          for full search &amp; filters.
        </p>
      )}
    </div>
  );
}
