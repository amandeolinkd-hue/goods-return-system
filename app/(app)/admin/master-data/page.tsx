import { requireRole } from "@/lib/rbac";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/placeholder";

export const metadata = { title: "Master Data · Goods Return System" };

export default async function MasterDataPage() {
  await requireRole("admin");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data"
        description="Parties, brokers, qualities and transports."
      />
      <ComingSoon
        phase="Phase 6"
        note="Master data is imported from your Google Sheets; management UI comes with the migration phase."
      />
    </div>
  );
}
