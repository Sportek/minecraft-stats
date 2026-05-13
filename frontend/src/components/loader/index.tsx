import { HTMLAttributes } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  message: string;
  className?: string;
}

const Loader = ({ message, className, ...props }: LoaderProps) => {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 text-muted-foreground", className)}
      {...props}
    >
      <Spinner size="lg" tone="accent" label={message} />
      <div className="text-sm">{message}</div>
    </div>
  );
};

export default Loader;
