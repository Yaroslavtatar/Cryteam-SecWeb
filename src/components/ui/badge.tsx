import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/10 text-primary",
        neutral: "border-border bg-muted/50 text-muted-foreground",
        attack: "border-destructive/30 bg-destructive/10 text-destructive",
        defense: "border-[hsl(var(--defense))]/30 bg-[hsl(var(--defense))]/10 text-[hsl(var(--defense))]",
        data: "border-[hsl(var(--data))]/30 bg-[hsl(var(--data))]/10 text-[hsl(var(--data))]",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
