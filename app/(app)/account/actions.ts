"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/rbac";
import { verifyPassword, hashPassword } from "@/lib/password";

export type ChangePwState = { error?: string; success?: string };

const schema = z.object({
  current: z.string().min(1, "Enter your current password"),
  next: z.string().min(6, "New password must be at least 6 characters"),
});

export async function changeOwnPassword(
  _prev: ChangePwState,
  formData: FormData
): Promise<ChangePwState> {
  const sessionUser = await requireUser();

  const parsed = schema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [user] = await db.select().from(users).where(eq(users.id, Number(sessionUser.id))).limit(1);
  if (!user) return { error: "User not found." };

  const ok = await verifyPassword(parsed.data.current, user.passwordHash);
  if (!ok) return { error: "Your current password is incorrect." };

  if (parsed.data.current === parsed.data.next) {
    return { error: "New password must be different from the current one." };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.next) })
    .where(eq(users.id, user.id));

  return { success: "Password updated successfully." };
}
