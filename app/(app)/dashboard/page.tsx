import { requireUser } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/placeholder";

export const metadata = { title: "Dashboard · Goods Return System" };

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.name ?? user.email}`}
        description={`Signed in as ${ROLE_LABELS[user.role]}.`}
      />
      <ComingSoon
        phase="Phase 4"
        note="Entry stats and the searchable returns table will appear here."
      />
    </div>
  );
}
