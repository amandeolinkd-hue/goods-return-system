import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/placeholder";

export const metadata = { title: "All Returns · Goods Return System" };

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="All Returns" description="Search, filter and edit goods-return entries." />
      <ComingSoon phase="Phase 4" note="The returns list with search and filters is coming next." />
    </div>
  );
}
