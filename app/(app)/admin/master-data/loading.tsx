import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-10 w-80 rounded-xl" />
      <Card>
        <CardContent className="px-0 py-0">
          <TableSkeleton rows={10} cols={2} />
        </CardContent>
      </Card>
    </div>
  );
}
