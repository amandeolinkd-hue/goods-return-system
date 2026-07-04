import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Builds a URL to `basePath` carrying `params` with `page` overridden. */
function pageHref(basePath: string, params: Record<string, string>, page: number) {
  const p = new URLSearchParams(params);
  p.set("page", String(page));
  return `${basePath}?${p.toString()}`;
}

export function Pagination({
  basePath,
  params = {},
  page,
  totalPages,
  totalLabel,
}: {
  basePath: string;
  params?: Record<string, string>;
  page: number;
  totalPages: number;
  totalLabel?: string;
}) {
  if (totalPages <= 1 && !totalLabel) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {totalLabel ?? `Page ${page} of ${totalPages}`}
      </p>
      {totalPages > 1 && (
        <div className="flex gap-2">
          <Link href={pageHref(basePath, params, Math.max(1, page - 1))} aria-disabled={page <= 1}>
            <Button variant="outline" size="sm" disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
          </Link>
          <Link
            href={pageHref(basePath, params, Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
          >
            <Button variant="outline" size="sm" disabled={page >= totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
