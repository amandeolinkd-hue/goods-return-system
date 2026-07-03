import Link from "next/link";
import { getReturnsList, getReturnFilterParties, type ReturnStatus } from "@/lib/returns-query";
import { RETURN_REASONS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/rbac";
import { hasRole } from "@/lib/rbac";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/returns/status-badge";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "All Returns · Goods Return System" };

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

function buildQuery(sp: SP, overrides: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const k of ["search", "status", "partyId", "reason", "dateFrom", "dateTo", "page"]) {
    const v = str(sp[k]);
    if (v) p.set(k, v);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === "") p.delete(k);
    else p.set(k, String(v));
  }
  return `/returns?${p.toString()}`;
}

export default async function ReturnsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const canCreate = hasRole(user, "admin", "kalbadevi");

  const filter = {
    search: str(sp.search) || undefined,
    status: (str(sp.status) as ReturnStatus) || undefined,
    partyId: str(sp.partyId) ? Number(str(sp.partyId)) : undefined,
    reason: str(sp.reason) || undefined,
    dateFrom: str(sp.dateFrom) || undefined,
    dateTo: str(sp.dateTo) || undefined,
    page: str(sp.page) ? Number(str(sp.page)) : 1,
  };

  const [list, filterParties] = await Promise.all([
    getReturnsList(filter),
    getReturnFilterParties(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="All Returns"
        description={`${list.total} entr${list.total === 1 ? "y" : "ies"} found.`}
        action={
          canCreate ? (
            <Link href="/returns/new">
              <Button>+ New Return</Button>
            </Link>
          ) : null
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <form method="get" action="/returns" className="grid gap-3 md:grid-cols-6 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                name="search"
                placeholder="LD id, bill, LR, party, broker"
                defaultValue={str(sp.search)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={str(sp.status)}>
                <option value="">All</option>
                <option value="posted">Posted</option>
                <option value="received">Received</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="partyId">Party</Label>
              <Select id="partyId" name="partyId" defaultValue={str(sp.partyId)}>
                <option value="">All</option>
                {filterParties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select id="reason" name="reason" defaultValue={str(sp.reason)}>
                <option value="">All</option>
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <div>
                <Label htmlFor="dateFrom">From</Label>
                <Input id="dateFrom" name="dateFrom" type="date" defaultValue={str(sp.dateFrom)} />
              </div>
              <div>
                <Label htmlFor="dateTo">To</Label>
                <Input id="dateTo" name="dateTo" type="date" defaultValue={str(sp.dateTo)} />
              </div>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit">Apply</Button>
              <Link href="/returns">
                <Button type="button" variant="outline">
                  Reset
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
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
                <TH>Status</TH>
                <TH className="pr-6" />
              </TR>
            </THead>
            <TBody>
              {list.rows.length === 0 ? (
                <TR>
                  <TD className="pl-6 py-8 text-muted-foreground" colSpan={9}>
                    No returns match these filters.
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
                    <TD>
                      <StatusBadge status={r.status} />
                    </TD>
                    <TD className="pr-6 text-right">
                      <Link href={`/returns/${r.id}`} className="text-sm text-primary hover:underline">
                        View
                      </Link>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {list.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {list.page} of {list.totalPages}
          </p>
          <div className="flex gap-2">
            <Link href={buildQuery(sp, { page: list.page - 1 })} aria-disabled={list.page <= 1}>
              <Button variant="outline" size="sm" disabled={list.page <= 1}>
                Previous
              </Button>
            </Link>
            <Link href={buildQuery(sp, { page: list.page + 1 })} aria-disabled={list.page >= list.totalPages}>
              <Button variant="outline" size="sm" disabled={list.page >= list.totalPages}>
                Next
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
