import Link from "next/link";
import { notFound } from "next/navigation";
import { getReturnDetail } from "@/lib/returns-query";
import { getCurrentUser, hasRole } from "@/lib/rbac";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/returns/status-badge";
import { ReceiveAction } from "@/components/returns/receive-action";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value ?? "-"}</dd>
    </div>
  );
}

export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const [detail, user] = await Promise.all([getReturnDetail(numId), getCurrentUser()]);
  if (!detail) notFound();
  const canEdit = hasRole(user, "admin", "kalbadevi");
  const canReceive = hasRole(user, "admin", "bhiwandi") && detail.status === "posted";

  const charges =
    (Number(detail.totalValue ?? 0) || 0) +
    (Number(detail.transportValue ?? 0) || 0) +
    (Number(detail.otherCharges ?? 0) || 0);

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title={detail.displayId}
        description={`${detail.entryFor} · ${detail.partyName ?? "-"}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={detail.status} />
            {canReceive && <ReceiveAction returnId={detail.id} displayId={detail.displayId} />}
            {canEdit && (
              <Link href={`/returns/${detail.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            )}
            <Link href="/returns">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Field label="Entry For" value={detail.entryFor} />
            <Field label="Bill No" value={detail.billNo} />
            <Field label="LR / Tracking No" value={detail.trackingNo} />
            <Field label="Date" value={formatDate(detail.dated)} />
            <Field label="Posted to Bhiwandi" value={formatDate(detail.postedOn)} />
            <Field label="Transport" value={detail.transportName} />
            <Field label="Party" value={detail.partyName} />
            <Field label="Broker" value={detail.brokerName} />
            <Field
              label="Reason"
              value={
                detail.returnReason === "Other"
                  ? `Other — ${detail.customReason ?? ""}`
                  : detail.returnReason
              }
            />
            <Field
              label="Attachment"
              value={
                detail.attachmentUrl ? (
                  <a
                    href={detail.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    Open
                  </a>
                ) : (
                  "-"
                )
              }
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quality lines ({detail.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <THead>
              <TR>
                <TH className="pl-6">Quality</TH>
                <TH className="text-right">Quantity (Mtr)</TH>
                <TH className="text-right pr-6">Pcs</TH>
              </TR>
            </THead>
            <TBody>
              {detail.items.map((it) => (
                <TR key={it.id}>
                  <TD className="pl-6">{it.qualityName ?? "-"}</TD>
                  <TD className="text-right tabular-nums">{it.quantity ?? "-"}</TD>
                  <TD className="text-right pr-6 tabular-nums">{it.pieces ?? "-"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Amounts</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 grid-cols-2">
              <Field label="Total Billing" value={formatINR(detail.totalValue)} />
              <Field label="Transport (LR)" value={formatINR(detail.transportValue)} />
              <Field label="Other Charges" value={formatINR(detail.otherCharges)} />
              <Field label="Sum" value={formatINR(charges)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receiving (Bhiwandi)</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 grid-cols-2">
              <Field label="Created by" value={detail.createdByName} />
              <Field label="Created at" value={formatDateTime(detail.createdAt)} />
              <Field label="Received by" value={detail.receivedByName} />
              <Field label="Status updated on" value={formatDateTime(detail.receivedAt)} />
              <Field
                label="Transport value (Balasaheb)"
                value={formatINR(detail.bhiwandiTransportValue)}
              />
              <Field
                label="Bhiwandi transport & charges"
                value={formatINR(detail.bhiwandiCharges)}
              />
              {detail.receivingNotes && (
                <div className="col-span-2">
                  <Field label="Receiving notes" value={detail.receivingNotes} />
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
