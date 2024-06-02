import { cn } from "@/lib/utils";

interface RestrictedWidthLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const RestrictedWidthLayout = ({ children, className, ...props }: RestrictedWidthLayoutProps) => {
  return (
    <div className={cn("w-full mx-auto max-w-6xl px-4", className)} {...props}>
      {children}
    </div>
  );
};

export default RestrictedWidthLayout;
