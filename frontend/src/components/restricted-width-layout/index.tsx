import { cn } from "@/lib/utils";

interface RestrictedWidthLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const RestrictedWidthLayout = ({ children, className, ...props }: RestrictedWidthLayoutProps) => {
  return (
    <div className={cn("w-full max-w-[1200px]", className)} {...props}>
      {children}
    </div>
  );
};

export default RestrictedWidthLayout;
