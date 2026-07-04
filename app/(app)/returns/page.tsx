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
import { ReturnMobileList } from "@/components/returns/return-mobile-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchX } from "lucide-react";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "All Returns · Goods Return System" };

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

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

  // Export link carries the current filters (minus pagination).
  const exportParams = new URLSearchParams();
  for (const k of ["search", "status", "partyId", "reason", "dateFrom", "dateTo"]) {
    const v = str(sp[k]);
    if (v) exportParams.set(k, v);
  }
  const exportHref = `/returns/export?${exportParams.toString()}`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="All Returns"
        description={`${list.total} entr${list.total === 1 ? "y" : "ies"} found.`}
        action={
          <div className="flex items-center gap-2">
            <a href={exportHref}>
              <Button variant="outline">Export CSV</Button>
            </a>
            {canCreate && (
              <Link href="/returns/new">
                <Button>+ New Return</Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <form
            method="get"
            action="/returns"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6 items-end"
          >
            <div className="sm:col-span-2">
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
                <option value="posted">Pending</option>
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
            <div className="grid grid-cols-2 gap-2 sm:col-span-2 md:col-span-2">
              <div>
                <Label htmlFor="dateFrom">From</Label>
                <Input id="dateFrom" name="dateFrom" type="date" defaultValue={str(sp.dateFrom)} />
              </div>
              <div>
                <Label htmlFor="dateTo">To</Label>
                <Input id="dateTo" name="dateTo" type="date" defaultValue={str(sp.dateTo)} />
              </div>
            </div>
            <div className="flex gap-2 sm:col-span-2 md:col-span-2">
              <Button type="submit" className="flex-1 sm:flex-none">
                Apply
              </Button>
              <Link href="/returns" className="flex-1 sm:flex-none">
                <Button type="button" variant="outline" className="w-full">
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
          {list.rows.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No returns found"
              description="Try adjusting your search or filters."
            />
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
                <TH className="hidden lg:table-cell">Broker</TH>
                <TH className="hidden lg:table-cell">Lines</TH>
                <TH className="hidden md:table-cell">Reason</TH>
                <TH className="text-right">Total</TH>
                <TH>Status</TH>
                <TH className="pr-6" />
              </TR>
            </THead>
            <TBody>
              {list.rows.length === 0 ? null : (
                list.rows.map((r) => (
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
          </div>
          </>
          )}
        </CardContent>
      </Card>

      <Pagination
        basePath="/returns"
        params={Object.fromEntries(exportParams)}
        page={list.page}
        totalPages={list.totalPages}
        totalLabel={`${list.total} ${list.total === 1 ? "entry" : "entries"} · page ${list.page} of ${list.totalPages}`}
      />
    </div>
  );
}
