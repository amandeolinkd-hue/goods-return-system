"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { parties, brokers, qualities, transports } from "@/db/schema";
import { requireRole } from "@/lib/rbac";
import type { MasterType } from "@/lib/master-data";

export type AddState = { error?: string; success?: string };

export async function addMasterEntry(type: MasterType, rawName: string): Promise<AddState> {
  await requireRole("admin");
  const name = rawName.trim();
  if (!name) return { error: "Please enter a name." };
  if (name.length > 255) return { error: "Name is too long." };

  try {
    let inserted: { id: number }[];
    if (type === "parties") {
      inserted = await db.insert(parties).values({ name }).onConflictDoNothing().returning({ id: parties.id });
    } else if (type === "brokers") {
      inserted = await db.insert(brokers).values({ name }).onConflictDoNothing().returning({ id: brokers.id });
    } else if (type === "qualities") {
      inserted = await db.insert(qualities).values({ name }).onConflictDoNothing().returning({ id: qualities.id });
    } else {
      inserted = await db.insert(transports).values({ name }).onConflictDoNothing().returning({ id: transports.id });
    }

    if (inserted.length === 0) return { error: `"${name}" already exists.` };
    revalidatePath("/admin/master-data");
    return { success: `Added "${name}".` };
  } catch (e) {
    console.error("addMasterEntry failed", e);
    return { error: "Could not add. Please try again." };
  }
}
