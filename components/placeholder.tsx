import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({ phase, note }: { phase: string; note: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">{phase}</p>
        <p className="mt-2 text-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
