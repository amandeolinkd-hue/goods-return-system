import { cn } from "@/lib/utils";

/**
 * The LD Silk Mills crest. Renders /logo.png (a transparent-background PNG the
 * user drops into /public). `chip` wraps it in a white rounded tile so the
 * navy/red crest stays legible on dark surfaces (e.g. the sidebar).
 */
export function BrandMark({
  size = 32,
  chip = false,
  className,
  imgClassName,
}: {
  size?: number;
  chip?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="LD Silk Mills"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("object-contain", imgClassName)}
    />
  );

  if (!chip) {
    return <span className={cn("inline-flex shrink-0", className)}>{img}</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm",
        className
      )}
    >
      {img}
    </span>
  );
}
