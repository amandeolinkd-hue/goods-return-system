import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/placeholder";

export const metadata = { title: "Reports · Goods Return System" };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Totals by status, party, reason and month." />
      <ComingSoon phase="Phase 7" note="Reporting and CSV export are coming soon." />
    </div>
  );
}
