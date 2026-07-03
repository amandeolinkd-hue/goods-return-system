import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { getReportData } from "@/lib/reports";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Reports · Goods Return System" };

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
}

export default async function ReportsPage() {
  await requireUser();
  const { byStatus, byReason, byParty, byMonth } = await getReportData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Totals by status, reason, party and month."
        action={
          <Link href="/returns/export">
            <Button variant="outline">Export all to CSV</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By status</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <THead>
                <TR>
                  <TH className="pl-6">Status</TH>
                  <TH className="text-right">Count</TH>
                  <TH className="text-right pr-6">Value</TH>
                </TR>
              </THead>
              <TBody>
                {byStatus.map((s) => (
                  <TR key={s.status}>
                    <TD className="pl-6 capitalize">{s.status}</TD>
                    <TD className="text-right tabular-nums">{s.n}</TD>
                    <TD className="text-right pr-6 tabular-nums">{formatINR(s.value)}</TD>
                  </TR>
                ))}
                {byStatus.length === 0 && (
                  <TR>
                    <TD className="pl-6 py-6 text-muted-foreground" colSpan={3}>
                      No data yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By reason</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <THead>
                <TR>
                  <TH className="pl-6">Reason</TH>
                  <TH className="text-right">Count</TH>
                  <TH className="text-right pr-6">Value</TH>
                </TR>
              </THead>
              <TBody>
                {byReason.map((r) => (
                  <TR key={r.reason}>
                    <TD className="pl-6">{r.reason}</TD>
                    <TD className="text-right tabular-nums">{r.n}</TD>
                    <TD className="text-right pr-6 tabular-nums">{formatINR(r.value)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top parties</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <THead>
                <TR>
                  <TH className="pl-6">Party</TH>
                  <TH className="text-right">Count</TH>
                  <TH className="text-right pr-6">Value</TH>
                </TR>
              </THead>
              <TBody>
                {byParty.map((p) => (
                  <TR key={p.party}>
                    <TD className="pl-6">{p.party}</TD>
                    <TD className="text-right tabular-nums">{p.n}</TD>
                    <TD className="text-right pr-6 tabular-nums">{formatINR(p.value)}</TD>
                  </TR>
                ))}
                {byParty.length === 0 && (
                  <TR>
                    <TD className="pl-6 py-6 text-muted-foreground" colSpan={3}>
                      No data yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By month</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <THead>
                <TR>
                  <TH className="pl-6">Month</TH>
                  <TH className="text-right">Count</TH>
                  <TH className="text-right pr-6">Value</TH>
                </TR>
              </THead>
              <TBody>
                {byMonth.map((m) => (
                  <TR key={m.month}>
                    <TD className="pl-6">{monthLabel(m.month)}</TD>
                    <TD className="text-right tabular-nums">{m.n}</TD>
                    <TD className="text-right pr-6 tabular-nums">{formatINR(m.value)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
