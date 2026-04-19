import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[#D4AF37]/35 bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25",
        secondary: "border-[#D4AF37]/20 bg-[#1C2541] text-secondary-foreground hover:border-[#D4AF37]/35",
        destructive: "border-rose-500/50 bg-rose-900/50 text-rose-400 hover:bg-rose-900/70",
        outline: "border-[#D4AF37]/30 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
