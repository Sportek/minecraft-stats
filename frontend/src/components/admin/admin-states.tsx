import { ReactNode } from "react";

/** Full-screen centered loading state shared across admin pages. */
export const AdminLoadingState = ({ label }: { label: string }) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-lg text-foreground">{label}</div>
  </div>
);

/** Full-screen access-denied / not-found state shared across admin pages. */
export const AdminMessageState = ({
  title,
  description,
  tone = "default",
  children,
}: {
  title: string;
  description?: string;
  tone?: "default" | "destructive";
  children?: ReactNode;
}) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <h1
        className={`mb-2 text-2xl font-bold ${
          tone === "destructive" ? "text-destructive" : "text-foreground"
        }`}
      >
        {title}
      </h1>
      {description && <p className="mb-6 text-muted-foreground">{description}</p>}
      {children}
    </div>
  </div>
);
