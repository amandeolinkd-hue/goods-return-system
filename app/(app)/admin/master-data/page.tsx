import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { getMasterList, getMasterCounts, type MasterType } from "@/lib/master-data";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export const metadata = { title: "Master Data · Goods Return System" };

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

const TAB_LABELS: Record<MasterType, string> = {
  parties: "Parties",
  brokers: "Brokers",
  qualities: "Qualities",
  transports: "Transports",
};

export default async function MasterDataPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireRole("admin");
  const sp = await searchParams;
  const tabRaw = str(sp.tab);
  const tab: MasterType = (["parties", "brokers", "qualities", "transports"] as const).includes(
    tabRaw as MasterType
  )
    ? (tabRaw as MasterType)
    : "parties";
  const q = str(sp.q);
  const page = Number(str(sp.page)) || 1;

  const [counts, list] = await Promise.all([getMasterCounts(), getMasterList(tab, q, page)]);

  const mkHref = (over: Record<string, string | number>) => {
    const p = new URLSearchParams();
    p.set("tab", tab);
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(over)) p.set(k, String(v));
    return `/admin/master-data?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master Data"
        description="Parties, brokers, qualities and transports used across the system."
      />

      <Tabs
        items={(["parties", "brokers", "qualities", "transports"] as const).map((t) => ({
          label: TAB_LABELS[t],
          href: `/admin/master-data?tab=${t}`,
          active: tab === t,
          count: counts[t],
        }))}
      />

      <Card>
        <CardContent className="pt-5">
          <form method="get" action="/admin/master-data" className="flex gap-2">
            <input type="hidden" name="tab" value={tab} />
            <Input
              name="q"
              defaultValue={q}
              placeholder={`Search ${TAB_LABELS[tab].toLowerCase()}…`}
              className="max-w-sm"
            />
            <Button type="submit">Search</Button>
            {q && (
              <Link href={`/admin/master-data?tab=${tab}`}>
                <Button type="button" variant="outline">
                  Clear
                </Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 py-0">
          <Table>
            <THead>
              <TR>
                <TH className="pl-6 w-16">#</TH>
                <TH>Name</TH>
              </TR>
            </THead>
            <TBody>
              {list.rows.length === 0 ? (
                <TR>
                  <TD className="pl-6 py-8 text-muted-foreground" colSpan={2}>
                    No {TAB_LABELS[tab].toLowerCase()} found{q ? ` for “${q}”` : ""}.
                  </TD>
                </TR>
              ) : (
                list.rows.map((r, i) => (
                  <TR key={r.id}>
                    <TD className="pl-6 text-muted-foreground tabular-nums">
                      {(list.page - 1) * 25 + i + 1}
                    </TD>
                    <TD className="font-medium">{r.name}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {list.total.toLocaleString("en-IN")} {TAB_LABELS[tab].toLowerCase()} · page {list.page} of{" "}
          {list.totalPages}
        </p>
        <div className="flex gap-2">
          <Link href={mkHref({ page: list.page - 1 })} aria-disabled={list.page <= 1}>
            <Button variant="outline" size="sm" disabled={list.page <= 1}>
              Previous
            </Button>
          </Link>
          <Link href={mkHref({ page: list.page + 1 })} aria-disabled={list.page >= list.totalPages}>
            <Button variant="outline" size="sm" disabled={list.page >= list.totalPages}>
              Next
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
