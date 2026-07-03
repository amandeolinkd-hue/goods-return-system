"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { returnInputSchema } from "@/lib/validation";
import { uploadAttachment } from "@/lib/blob";
import { insertReturn } from "@/lib/returns";

export type CreateReturnState = { error?: string; displayId?: string };

export async function createReturn(
  _prev: CreateReturnState,
  formData: FormData
): Promise<CreateReturnState> {
  const user = await requireRole("admin", "kalbadevi");

  let itemsRaw: unknown = [];
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Could not read quality lines." };
  }

  const parsed = returnInputSchema.safeParse({
    billNo: formData.get("billNo") ?? undefined,
    entryFor: formData.get("entryFor"),
    trackingNo: formData.get("trackingNo") ?? undefined,
    dated: formData.get("dated"),
    postedOn: formData.get("postedOn") ?? undefined,
    partyId: formData.get("partyId"),
    brokerId: formData.get("brokerId"),
    transportId: formData.get("transportId") ?? undefined,
    totalValue: formData.get("totalValue") ?? undefined,
    transportValue: formData.get("transportValue") ?? undefined,
    otherCharges: formData.get("otherCharges") ?? undefined,
    returnReason: formData.get("returnReason"),
    customReason: formData.get("customReason") ?? undefined,
    items: itemsRaw,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Optional attachment -> Vercel Blob.
  let attachmentUrl: string | null = null;
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    try {
      attachmentUrl = await uploadAttachment(file, "returns");
    } catch (e) {
      console.error("Attachment upload failed", e);
    }
  }

  try {
    const displayId = await insertReturn(parsed.data, {
      createdBy: Number(user.id),
      attachmentUrl,
    });
    revalidatePath("/returns");
    revalidatePath("/dashboard");
    return { displayId };
  } catch (e) {
    console.error("createReturn failed", e);
    return { error: "Could not save the return. Please try again." };
  }
}
