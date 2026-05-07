"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-foreground",
  {
    variants: {
      variant: {
        default: "",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
        info: "border-sky-500/20 bg-sky-500/10 text-sky-200"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

