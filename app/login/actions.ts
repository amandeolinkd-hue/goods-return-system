"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { homePathForRole } from "@/lib/roles";

export async function signInAs(office: "head" | "bhiwandi"): Promise<{ error?: string }> {
  const redirectTo = office === "bhiwandi" ? homePathForRole("bhiwandi") : homePathForRole("admin");
  try {
    await signIn("credentials", { office, redirectTo });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Could not sign in. Please try again." };
    }
    // Re-throw the redirect (NEXT_REDIRECT) so navigation happens.
    throw error;
  }
}
