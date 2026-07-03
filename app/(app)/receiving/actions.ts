"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { returns } from "@/db/schema";
import { requireRole } from "@/lib/rbac";

export type ReceiveResult = { ok?: true; error?: string };

export type ReceiveInput = {
  notes?: string;
  bhiwandiTransportValue?: string;
  bhiwandiCharges?: string;
};

const money = (v?: string): string | null => {
  if (v == null) return null;
  const cleaned = v.replace(/[₹,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : null;
};

export async function markReceived(returnId: number, input: ReceiveInput = {}): Promise<ReceiveResult> {
  const user = await requireRole("admin", "bhiwandi");
  if (!Number.isInteger(returnId)) return { error: "Invalid id." };

  const updated = await db
    .update(returns)
    .set({
      status: "received",
      receivedBy: Number(user.id),
      receivedAt: new Date(),
      receivingNotes: input.notes?.trim() || null,
      bhiwandiTransportValue: money(input.bhiwandiTransportValue),
      bhiwandiCharges: money(input.bhiwandiCharges),
    })
    // Only a still-pending return can be received (guards double-receipt).
    .where(and(eq(returns.id, returnId), eq(returns.status, "posted")))
    .returning({ id: returns.id });

  if (updated.length === 0) return { error: "This return was already received." };

  revalidatePath("/receiving");
  revalidatePath(`/returns/${returnId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
