import { redirect } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { homePathForRole } from "@/lib/roles";

export default async function RootPage() {
  const user = await requireUser();
  redirect(homePathForRole(user.role));
}
