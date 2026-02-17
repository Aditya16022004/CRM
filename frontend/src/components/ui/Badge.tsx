/**
 * Badge Component for status indicators
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary-50 text-primary-600 border border-primary-200",
        success: "bg-success-50 text-success-600 border border-success-200",
        warning: "bg-warning-50 text-warning-600 border border-warning-200",
        danger: "bg-danger-50 text-danger-600 border border-danger-200",
        secondary: "bg-slate-100 text-slate-600 border border-slate-200",
        outline: "text-slate-900 border border-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
