import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const spinnerVariants = cva("inline-block animate-spin rounded-full border-2 border-current border-t-transparent", {
  variants: {
    size: {
      xs: "h-3 w-3 border",
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-10 w-10 border-[3px]",
      xl: "h-14 w-14 border-4",
    },
    tone: {
      accent: "text-accent",
      foreground: "text-foreground",
      muted: "text-muted-foreground",
      current: "text-current",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "accent",
  },
});

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

export const Spinner = ({ className, size, tone, label = "Loading", ...props }: SpinnerProps) => {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size, tone }), className)}
      {...props}
    />
  );
};
