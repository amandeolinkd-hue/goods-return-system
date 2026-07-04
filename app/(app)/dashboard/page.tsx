import Link from "next/link";
import {
  ClipboardList,
  PackageCheck,
  Truck,
  CalendarDays,
  PlusCircle,
  Inbox,
  ArrowRight,
} from "lucide-react";
import { requireUser, hasRole } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/roles";
import { getReturnStats, getReturnsList } from "@/lib/returns-query";
import { getReportData } from "@/lib/reports";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { MiniBarChart } from "@/components/mini-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/returns/status-badge";
import { ReturnMobileList } from "@/components/returns/return-mobile-list";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Dashboard · Goods Return System" };

function monthShort(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short" });
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, recent, report] = await Promise.all([
    getReturnStats(),
    getReturnsList({ pageSize: 6 }),
    getReportData(),
  ]);
  const canCreate = hasRole(user, "admin", "kalbadevi");
  const chart = [...report.byMonth].reverse().map((m) => ({ label: monthShort(m.month), value: m.n }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.name ?? user.email}`}
        description={`Signed in as ${ROLE_LABELS[user.role]}.`}
        action={
          canCreate ? (
            <Link href="/returns/new">
              <Button>
                <PlusCircle className="h-4 w-4" />
                New Return
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total returns" value={stats.total} icon={ClipboardList} tone="primary" />
        <StatCard
          label="Awaiting receipt"
          value={stats.posted}
          hint="Pending at Bhiwandi"
          icon={Truck}
          tone="warning"
        />
        <StatCard label="Received" value={stats.received} icon={PackageCheck} tone="success" />
        <StatCard label="This month" value={stats.thisMonth} icon={CalendarDays} tone="muted" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Returns by month</CardTitle>
            <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Reports <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={chart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total billing value</CardTitle>
          </CardHeader>
          <CardContent className="flex h-44 flex-col justify-center">
            <div className="text-3xl font-bold tracking-tight">{formatINR(stats.totalValue)}</div>
            <p className="mt-1 text-sm text-muted-foreground">Across all {stats.total} returns.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent returns</CardTitle>
          <Link href="/returns" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="px-0">
          {recent.rows.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No returns yet"
              description={
                canCreate
                  ? "Create your first goods-return entry to get started."
                  : "Entries created by the Kalbadevi office will appear here."
              }
              action={
                canCreate ? (
                  <Link href="/returns/new">
                    <Button>
                      <PlusCircle className="h-4 w-4" />
                      New Return
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
            <ReturnMobileList rows={recent.rows} />
            <div className="hidden sm:block">
            <Table>
              <THead>
                <TR>
                  <TH className="pl-6">LD Id</TH>
                  <TH>Date</TH>
                  <TH>Party</TH>
                  <TH className="text-right">Total</TH>
                  <TH className="pr-6">Status</TH>
                </TR>
              </THead>
              <TBody>
                {recent.rows.map((r) => (
                  <TR key={r.id}>
                    <TD className="pl-6 font-medium">
                      <Link href={`/returns/${r.id}`} className="text-primary hover:underline">
                        {r.displayId}
                      </Link>
                    </TD>
                    <TD>{formatDate(r.dated)}</TD>
                    <TD>{r.partyName ?? "-"}</TD>
                    <TD className="text-right tabular-nums">{formatINR(r.totalValue)}</TD>
                    <TD className="pr-6">
                      <StatusBadge status={r.status} />
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
    </div>
  );
}
