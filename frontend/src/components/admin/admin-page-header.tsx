import { ReactNode } from "react";

/** Page title + description with an optional trailing action, shared across admin list pages. */
export const AdminPageHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);
