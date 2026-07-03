import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import { getReturnsForExport, type ReturnStatus } from "@/lib/returns-query";
import { toCsv } from "@/lib/csv";
import { statusLabel } from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const rows = await getReturnsForExport({
    search: sp.get("search") || undefined,
    status: (sp.get("status") as ReturnStatus) || undefined,
    partyId: sp.get("partyId") ? Number(sp.get("partyId")) : undefined,
    reason: sp.get("reason") || undefined,
    dateFrom: sp.get("dateFrom") || undefined,
    dateTo: sp.get("dateTo") || undefined,
  });

  const headers = [
    "LD Id",
    "Date",
    "Entry For",
    "Bill No",
    "LR No",
    "Party",
    "Broker",
    "Reason",
    "Custom Reason",
    "Status",
    "Total Value",
    "Transport Value",
    "Other Charges",
    "Posted On",
    "Status Updated On",
    "Transport Value (Balasaheb)",
    "Bhiwandi Transport & Charges",
    "Quality Lines",
  ];
  const data = rows.map((r) => [
    r.displayId,
    formatDate(r.dated),
    r.entryFor,
    r.billNo,
    r.trackingNo,
    r.partyName,
    r.brokerName,
    r.reason,
    r.customReason,
    statusLabel(r.status),
    r.totalValue,
    r.transportValue,
    r.otherCharges,
    formatDate(r.postedOn),
    r.receivedAt ? formatDateTime(r.receivedAt) : "",
    r.bhiwandiTransportValue,
    r.bhiwandiCharges,
    r.items,
  ]);

  const csv = toCsv(headers, data);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="goods-returns-${stamp}.csv"`,
    },
  });
}
