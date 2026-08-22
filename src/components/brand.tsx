import Link from "next/link";
import { ShieldHalf } from "lucide-react";
import { cn } from "@/lib/utils";

// Текстовый бренд CRYTEAM SecWeb (без графических логотипов).
// Иконка-щит используется как нейтральный акцент интерфейса, не как логотип.
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
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="CRYTEAM SecWeb — на главную"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        <ShieldHalf className="h-5 w-5" strokeWidth={2} />
        <span className="absolute inset-0 rounded-lg animate-pulse-ring" aria-hidden />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-mono text-base font-bold tracking-widest text-foreground">
            CRYTEAM
          </span>
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-primary">
            SecWeb
          </span>
        </span>
      )}
    </Link>
  );
}
