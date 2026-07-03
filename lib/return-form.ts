import { returnInputSchema, type ReturnInput } from "@/lib/validation";
import { uploadAttachment } from "@/lib/blob";

export type ReturnFormResult = { error?: string; displayId?: string; id?: number };

/** Parse + validate the entry form's FormData into a typed ReturnInput. */
export function parseReturnFormData(formData: FormData): {
  data?: ReturnInput;
  error?: string;
} {
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
  return { data: parsed.data };
}

/** Uploads an attachment if present; returns its URL or null. */
export async function readAttachment(formData: FormData): Promise<string | null> {
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    try {
      return await uploadAttachment(file, "returns");
    } catch (e) {
      console.error("Attachment upload failed", e);
    }
  }
  return null;
}
