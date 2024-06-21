import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const ResearchInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <div className="flex items-center gap-2 rounded-md w-full px-3 bg-white dark:bg-zinc-900 text-sm py-2">
      <Icon icon="mdi:search" className="w-6 h-6" />
      <input
        type={type}
        className={cn(
          "flex h-full w-full focus-visible:outline-none text-zinc-900 dark:text-zinc-50 dark:bg-zinc-900",
          className,
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
ResearchInput.displayName = "ResearchInput";

export { ResearchInput };
