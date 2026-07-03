"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/rbac";
import { hashPassword } from "@/lib/password";
import { ROLES } from "@/lib/roles";

export type ActionState = { error?: string; success?: string };

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(ROLES as [string, ...string[]]),
});

export async function createUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("admin");

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { error: "A user with that email already exists." };
  }

  await db.insert(users).values({
    name,
    email,
    passwordHash: await hashPassword(password),
    role: role as (typeof ROLES)[number],
  });

  revalidatePath("/admin/users");
  return { success: `User ${email} created.` };
}

export async function setUserActive(userId: number, active: boolean): Promise<void> {
  const admin = await requireRole("admin");
  // Prevent an admin from deactivating themselves (avoids lock-out).
  if (Number(admin.id) === userId && !active) return;
  await db.update(users).set({ active }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function setUserRole(userId: number, role: (typeof ROLES)[number]): Promise<void> {
  await requireRole("admin");
  if (!ROLES.includes(role)) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

const resetSchema = z.object({
  userId: z.coerce.number().int().positive(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function resetPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("admin");
  const parsed = resetSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.password) })
    .where(eq(users.id, parsed.data.userId));
  revalidatePath("/admin/users");
  return { success: "Password updated." };
}
