"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { updateReturnRecord } from "@/lib/returns";
import { parseReturnFormData, readAttachment, type ReturnFormResult } from "@/lib/return-form";

export async function updateReturn(formData: FormData): Promise<ReturnFormResult> {
  await requireRole("admin", "kalbadevi");

  const id = Number(formData.get("returnId"));
  if (!id) return { error: "Missing return id." };

  const { data, error } = parseReturnFormData(formData);
  if (error || !data) return { error: error ?? "Invalid input" };

  // Only replace the attachment if a new file was actually chosen.
  const file = formData.get("attachment");
  const hasNewFile = file instanceof File && file.size > 0;
  const attachmentUrl = hasNewFile ? await readAttachment(formData) : undefined;

  try {
    await updateReturnRecord(id, data, attachmentUrl !== undefined ? { attachmentUrl } : {});
    revalidatePath(`/returns/${id}`);
    revalidatePath("/returns");
    return { id };
  } catch (e) {
    console.error("updateReturn failed", e);
    return { error: "Could not update the return. Please try again." };
  }
}
