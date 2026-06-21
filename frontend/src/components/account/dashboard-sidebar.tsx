"use client";

import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const BASE_ITEMS: NavItem[] = [
  { href: "/account/settings", label: "Profile", icon: "material-symbols:person-outline" },
  { href: "/account/my-servers", label: "My Servers", icon: "mynaui:servers" },
  { href: "/account/add-server", label: "Add Server", icon: "material-symbols:add-rounded" },
];

const WRITER_ITEMS: NavItem[] = [
  { href: "/admin/posts", label: "Articles", icon: "material-symbols:article-outline" },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: "material-symbols:group-outline" },
  { href: "/admin/advertisements", label: "Advertisements", icon: "material-symbols:ad-group-outline" },
];

const isActive = (pathname: string | null, href: string) =>
  pathname === href || (pathname?.startsWith(`${href}/`) ?? false);

const buildItems = (role: string | undefined): NavItem[] => {
  if (role === "admin") return [...BASE_ITEMS, ...WRITER_ITEMS, ...ADMIN_ITEMS];
  if (role === "writer") return [...BASE_ITEMS, ...WRITER_ITEMS];
  return BASE_ITEMS;
};

const DashboardSidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = buildItems(user?.role);

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-20 flex flex-col gap-0.5 rounded-xl border border-border bg-card p-3 shadow-xs">
        <p className="px-2 pb-2 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
          Dashboard
        </p>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors",
                active
                  ? "bg-accent/10 font-semibold text-accent"
                  : "font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon icon={item.icon} className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
