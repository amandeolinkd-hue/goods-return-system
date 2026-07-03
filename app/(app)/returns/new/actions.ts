"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { insertReturn } from "@/lib/returns";
import { parseReturnFormData, readAttachment, type ReturnFormResult } from "@/lib/return-form";

export async function createReturn(formData: FormData): Promise<ReturnFormResult> {
  const user = await requireRole("admin", "kalbadevi");

  const { data, error } = parseReturnFormData(formData);
  if (error || !data) return { error: error ?? "Invalid input" };

  const attachmentUrl = await readAttachment(formData);

  try {
    const { id, displayId } = await insertReturn(data, {
      createdBy: Number(user.id),
      attachmentUrl,
    });
    revalidatePath("/returns");
    revalidatePath("/dashboard");
    return { id, displayId };
  } catch (e) {
    console.error("createReturn failed", e);
    return { error: "Could not save the return. Please try again." };
  }
}
