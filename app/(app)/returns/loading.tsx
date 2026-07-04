import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardContent className="pt-5">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="px-0 py-0">
          <TableSkeleton rows={8} cols={6} />
        </CardContent>
      </Card>
    </div>
  );
}
