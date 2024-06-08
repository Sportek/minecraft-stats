import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const ResearchInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <div className="flex items-center gap-2 rounded-md w-full border px-3 border-stone-200 bg-zinc-100 text-sm">
      <Icon icon="mdi:search" className="w-6 h-6" />
      <input
        type={type}
        className={cn("flex h-10 w-full focus-visible:outline-none bg-zinc-100", className)}
        ref={ref}
        {...props}
      />
    </div>
  );
});
ResearchInput.displayName = "ResearchInput";

export { ResearchInput };
