"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { returns } from "@/db/schema";
import { requireRole } from "@/lib/rbac";

export type ReceiveResult = { ok?: true; error?: string };

export async function markReceived(returnId: number, notes?: string): Promise<ReceiveResult> {
  const user = await requireRole("admin", "bhiwandi");
  if (!Number.isInteger(returnId)) return { error: "Invalid id." };

  const updated = await db
    .update(returns)
    .set({
      status: "received",
      receivedBy: Number(user.id),
      receivedAt: new Date(),
      receivingNotes: notes?.trim() || null,
    })
    // Only a still-posted return can be received (guards double-receipt).
    .where(and(eq(returns.id, returnId), eq(returns.status, "posted")))
    .returning({ id: returns.id });

  if (updated.length === 0) return { error: "This return was already received." };

  revalidatePath("/receiving");
  revalidatePath(`/returns/${returnId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
