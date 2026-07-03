import { requireRole } from "@/lib/rbac";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/placeholder";

export const metadata = { title: "Receiving · Goods Return System" };

export default async function ReceivingPage() {
  await requireRole("admin", "bhiwandi");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Receiving Queue"
        description="Confirm goods received at the Bhiwandi office."
      />
      <ComingSoon phase="Phase 5" note="The receiving queue and 'Mark Received' action are coming soon." />
    </div>
  );
}
