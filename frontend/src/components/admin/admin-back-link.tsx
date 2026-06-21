import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/** "Back to list" link with a chevron, shared across admin detail/form pages. */
export const AdminBackLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent/80"
  >
    <ChevronLeft className="h-4 w-4" />
    {label}
  </Link>
);
