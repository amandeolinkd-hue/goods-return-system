import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { getReturnDetail } from "@/lib/returns-query";
import { PageHeader } from "@/components/page-header";
import {
  ReturnForm,
  type FormValues,
  type ReturnInitialLabels,
} from "@/app/(app)/returns/new/return-form";
import { updateReturn } from "./actions";

export const metadata = { title: "Edit Return · Goods Return System" };

export default async function EditReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin", "kalbadevi");
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const detail = await getReturnDetail(numId);
  if (!detail) notFound();

  const initial: FormValues = {
    billNo: detail.billNo ?? "",
    entryFor: detail.entryFor,
    trackingNo: detail.trackingNo ?? "",
    dated: detail.dated ?? "",
    postedOn: detail.postedOn ?? "",
    partyId: String(detail.partyId),
    brokerId: String(detail.brokerId),
    transportId: detail.transportId ? String(detail.transportId) : "",
    totalValue: detail.totalValue ?? "",
    transportValue: detail.transportValue ?? "",
    otherCharges: detail.otherCharges ?? "",
    returnReason: detail.returnReason,
    customReason: detail.customReason ?? "",
    items:
      detail.items.length > 0
        ? detail.items.map((it) => ({
            qualityId: it.qualityId ? String(it.qualityId) : "",
            quantity: it.quantity ?? "",
            pieces: it.pieces != null ? String(it.pieces) : "",
          }))
        : [{ qualityId: "", quantity: "", pieces: "" }],
  };

  const initialLabels: ReturnInitialLabels = {
    party: detail.partyName ?? undefined,
    broker: detail.brokerName ?? undefined,
    transport: detail.transportName ?? undefined,
    items: detail.items.map((it) => it.qualityName ?? undefined),
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={`Edit ${detail.displayId}`} description="Update this goods-return entry." />
      <ReturnForm
        action={updateReturn}
        mode="edit"
        initial={initial}
        initialLabels={initialLabels}
        returnId={detail.id}
        existingAttachmentUrl={detail.attachmentUrl}
        submitLabel="Save changes"
      />
    </div>
  );
}
