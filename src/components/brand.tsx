import Link from "next/link";
import { cn } from "@/lib/utils";

// Текстовый бренд CRYTEAM SecWeb — БЕЗ графических логотипов.
export function Brand({
  className,
  href = "/",
  compact = false,
}: {
  className?: string;
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-baseline gap-2", className)}
      aria-label="CRYTEAM SecWeb — на главную"
    >
      <span className="font-mono text-lg font-bold tracking-widest text-foreground transition-colors group-hover:text-primary">
        CRYTEAM
      </span>
      {!compact && (
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
          SecWeb
        </span>
      )}
    </Link>
  );
}
