import { requireRole } from "@/lib/rbac";
import { hasMasterData } from "@/lib/master-data";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReturnForm } from "./return-form";
import { createReturn } from "./actions";

export const metadata = { title: "New Return · Goods Return System" };

export default async function NewReturnPage() {
  await requireRole("admin", "kalbadevi");
  const ready = await hasMasterData();

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="New Goods Return"
        description="Record a return to post to the Bhiwandi office."
      />
      {ready ? (
        <ReturnForm action={createReturn} />
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No master data yet. Parties, brokers, qualities and transports must be
            imported or added before entries can be created.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
