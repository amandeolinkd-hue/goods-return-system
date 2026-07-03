import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { homePathForRole, type Role } from "@/lib/roles";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser | undefined) ?? null;
}

/** Redirect to /login if not authenticated; otherwise return the user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require one of the given roles; redirect to the user's home if not allowed. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(homePathForRole(user.role));
  }
  return user;
}

export function hasRole(user: SessionUser | null, ...roles: Role[]): boolean {
  return !!user && roles.includes(user.role);
}
