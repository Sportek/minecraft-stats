"use client";

import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface NavItem {
  href: string;
  key: string;
  icon: string;
}

const BASE_ITEMS: NavItem[] = [
  { href: "/account/settings", key: "profile", icon: "material-symbols:person-outline" },
  { href: "/account/my-servers", key: "myServers", icon: "mynaui:servers" },
  { href: "/account/add-server", key: "addServer", icon: "material-symbols:add-rounded" },
  { href: "/account/api-tokens", key: "apiTokens", icon: "material-symbols:key-outline" },
];

const WRITER_ITEMS: NavItem[] = [
  { href: "/admin/posts", key: "articles", icon: "material-symbols:article-outline" },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin/analytics", key: "analytics", icon: "material-symbols:bar-chart-4-bars" },
  { href: "/admin/users", key: "users", icon: "material-symbols:group-outline" },
  { href: "/admin/advertisements", key: "advertisements", icon: "material-symbols:ad-group-outline" },
];

const isActive = (pathname: string | null, href: string) =>
  pathname === href || (pathname?.startsWith(`${href}/`) ?? false);

const buildItems = (role: string | undefined): NavItem[] => {
  if (role === "admin") return [...BASE_ITEMS, ...WRITER_ITEMS, ...ADMIN_ITEMS];
  if (role === "writer") return [...BASE_ITEMS, ...WRITER_ITEMS];
  return BASE_ITEMS;
};

const DashboardSidebar = () => {
  const t = useTranslations("Account");
  const pathname = usePathname();
  const { user } = useAuth();
  const items = buildItems(user?.role);

  return (
    <>
      {/* Mobile / tablette : la sidebar desktop est cachée, donc la nav du
          dashboard passe par cette barre d'onglets horizontale scrollable. */}
      <nav className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
                active
                  ? "border-accent/30 bg-accent/10 font-semibold text-accent"
                  : "border-border bg-card font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon icon={item.icon} className="h-4 w-4 shrink-0" />
              {t(`nav.${item.key}`)}
            </Link>
          );
        })}
      </nav>

      {/* Desktop : sidebar verticale sticky */}
      <aside className="hidden lg:block">
        <nav className="sticky top-20 flex flex-col gap-0.5 rounded-xl border border-border bg-card p-3 shadow-xs">
          <p className="px-2 pb-2 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("nav.dashboard")}
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
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default DashboardSidebar;
