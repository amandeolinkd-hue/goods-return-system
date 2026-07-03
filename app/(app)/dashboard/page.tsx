import Link from "next/link";
import { requireUser, hasRole } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/roles";
import { getReturnStats, getReturnsList } from "@/lib/returns-query";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/returns/status-badge";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Dashboard · Goods Return System" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, recent] = await Promise.all([
    getReturnStats(),
    getReturnsList({ pageSize: 8 }),
  ]);
  const canCreate = hasRole(user, "admin", "kalbadevi");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.name ?? user.email}`}
        description={`Signed in as ${ROLE_LABELS[user.role]}.`}
        action={
          canCreate ? (
            <Link href="/returns/new">
              <Button>+ New Return</Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total returns" value={stats.total} />
        <StatCard label="Awaiting receipt" value={stats.posted} hint="Posted to Bhiwandi" />
        <StatCard label="Received" value={stats.received} />
        <StatCard label="This month" value={stats.thisMonth} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent returns</CardTitle>
          <Link href="/returns" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <THead>
              <TR>
                <TH className="pl-6">LD Id</TH>
                <TH>Date</TH>
                <TH>Party</TH>
                <TH className="text-right">Total</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {recent.rows.length === 0 ? (
                <TR>
                  <TD className="pl-6 py-8 text-muted-foreground" colSpan={5}>
                    No returns yet.
                  </TD>
                </TR>
              ) : (
                recent.rows.map((r) => (
                  <TR key={r.id}>
                    <TD className="pl-6 font-medium">
                      <Link href={`/returns/${r.id}`} className="text-primary hover:underline">
                        {r.displayId}
                      </Link>
                    </TD>
                    <TD>{formatDate(r.dated)}</TD>
                    <TD>{r.partyName ?? "-"}</TD>
                    <TD className="text-right tabular-nums">{formatINR(r.totalValue)}</TD>
                    <TD>
                      <StatusBadge status={r.status} />
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
