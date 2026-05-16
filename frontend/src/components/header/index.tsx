"use client";
import { useAuth } from "@/contexts/auth";
import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import { cn } from "@/lib/utils";
import { getClientBackendUrl } from "@/lib/domain";
import { Icon } from "@iconify/react";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RestrictedWidthLayout from "../restricted-width-layout";
import { ModeToggle } from "../dark-mode/toggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/", label: "Servers", icon: "material-symbols:list", matchPrefixes: ["/servers"] },
  { href: "/blog", label: "Blog", icon: "material-symbols:article-outline", matchPrefixes: ["/blog"] },
];

const useIsActive = () => {
  const pathname = usePathname();
  return (href: string, matchPrefixes: string[] = []) => {
    if (pathname === href) return true;
    if (href === "/" && pathname === "/") return true;
    return matchPrefixes.some((prefix) => pathname?.startsWith(prefix));
  };
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
);

const MobileMenuLink = ({
  href,
  icon,
  label,
  external,
  active,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  external?: boolean;
  active?: boolean;
  onClick: () => void;
}) => {
  const className = cn(
    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
    active ? "bg-accent/10 text-accent" : "text-foreground hover:bg-secondary"
  );

  const content = (
    <>
      <Icon icon={icon} className="h-5 w-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {external && <Icon icon="material-symbols:open-in-new" className="h-3.5 w-3.5 opacity-60" />}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined} className={className}>
      {content}
    </Link>
  );
};

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isActive = useIsActive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const backendUrl = getClientBackendUrl();
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Scroll lock du body quand le drawer mobile est ouvert
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobileMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  // Échappe pour fermer
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isMobileMenuOpen]);

  const displayUserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="User menu"
        className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar className="h-9 w-9">
          <AvatarImage src={user?.avatarUrl ?? ""} alt={user?.username ?? "User Avatar"} />
          <AvatarFallback className="bg-stats-blue-700 text-white text-sm">
            {user?.username?.[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-semibold text-sm">
          <div className="flex items-center gap-2">
            <Icon icon="material-symbols:person" className="w-4 h-4" />
            {user?.username.toUpperCase()}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/account/settings")}>Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account/add-server")}>Add a server</DropdownMenuItem>
        {(user?.role === "admin" || user?.role === "writer") && (
          <DropdownMenuItem onClick={() => router.push("/admin/posts")}>Manage blog</DropdownMenuItem>
        )}
        {user?.role === "admin" && (
          <DropdownMenuItem onClick={() => router.push("/admin/users")}>Manage users</DropdownMenuItem>
        )}
        {user?.role === "admin" && (
          <DropdownMenuItem onClick={() => router.push("/admin/advertisements")}>
            Manage advertisements
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-stats-blue-50/85 backdrop-blur-md supports-[backdrop-filter]:bg-stats-blue-50/80 dark:bg-stats-blue-1050/85 dark:supports-[backdrop-filter]:bg-stats-blue-1050/80">
        <RestrictedWidthLayout className="flex h-16 items-center justify-between gap-4">
          {/* Left: brand + nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src={MinecraftStatsLogo} alt="" width={28} height={28} />
              <span className="text-base font-bold text-foreground">Minecraft Stats</span>
            </Link>
            <nav aria-label="Main" className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href, link.matchPrefixes);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-sm font-medium transition-colors",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <a
                href={`${backendUrl}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                API
                <Icon icon="material-symbols:open-in-new" className="h-3.5 w-3.5 opacity-60" />
              </a>
            </nav>
          </div>

          {/* Right: actions (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <ModeToggle />
            <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <Link href="/account/add-server">
              <Button variant="accent" size="sm">
                <Icon icon="material-symbols:add" className="mr-1 h-4 w-4" />
                Add server
              </Button>
            </Link>
            {user?.username ? (
              displayUserMenu()
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign in
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-drawer"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <Icon icon="material-symbols:menu" className="h-6 w-6" />
          </button>
        </RestrictedWidthLayout>
      </header>

      {/* Mobile drawer — slide from right */}
      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden",
          isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={closeMobileMenu}
        />

        {/* Drawer panel */}
        <aside
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-background shadow-2xl transition-transform duration-300 ease-out",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Drawer header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-stats-blue-50/40 px-4 dark:bg-stats-blue-1050/40">
            <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2">
              <Image src={MinecraftStatsLogo} alt="" width={28} height={28} />
              <span className="text-base font-bold text-foreground">Minecraft Stats</span>
            </Link>
            <button
              type="button"
              onClick={closeMobileMenu}
              aria-label="Close navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {/* Primary CTA */}
            <Link href="/account/add-server" className="block" onClick={closeMobileMenu}>
              <Button variant="accent" size="lg" className="w-full">
                <Icon icon="material-symbols:add" className="mr-2 h-5 w-5" />
                Add your server
              </Button>
            </Link>

            {/* Navigation */}
            <section className="mt-6 space-y-2">
              <SectionLabel>Navigation</SectionLabel>
              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <MobileMenuLink
                    key={link.href}
                    href={link.href}
                    icon={link.icon}
                    label={link.label}
                    active={isActive(link.href, link.matchPrefixes)}
                    onClick={closeMobileMenu}
                  />
                ))}
                <MobileMenuLink
                  href={`${backendUrl}/docs`}
                  icon="material-symbols:api"
                  label="API documentation"
                  external
                  onClick={closeMobileMenu}
                />
              </div>
            </section>

            {/* Account */}
            <section className="mt-6 space-y-2">
              <SectionLabel>Account</SectionLabel>

              {user?.username ? (
                <div className="space-y-1">
                  {/* User card */}
                  <div className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl ?? ""} alt={user.username} />
                      <AvatarFallback className="bg-stats-blue-700 text-white text-sm">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{user.username}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.role ?? "Connected"}</p>
                    </div>
                  </div>

                  <MobileMenuLink
                    href="/account/settings"
                    icon="material-symbols:settings-outline"
                    label="Profile settings"
                    active={isActive("/account/settings")}
                    onClick={closeMobileMenu}
                  />
                  {(user?.role === "admin" || user?.role === "writer") && (
                    <MobileMenuLink
                      href="/admin/posts"
                      icon="material-symbols:article-outline"
                      label="Manage blog"
                      active={isActive("/admin/posts", ["/admin/posts"])}
                      onClick={closeMobileMenu}
                    />
                  )}
                  {user?.role === "admin" && (
                    <MobileMenuLink
                      href="/admin/users"
                      icon="material-symbols:group"
                      label="Manage users"
                      active={isActive("/admin/users", ["/admin/users"])}
                      onClick={closeMobileMenu}
                    />
                  )}
                  {user?.role === "admin" && (
                    <MobileMenuLink
                      href="/admin/advertisements"
                      icon="material-symbols:ad-group-outline"
                      label="Manage advertisements"
                      active={isActive("/admin/advertisements", ["/admin/advertisements"])}
                      onClick={closeMobileMenu}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Icon icon="material-symbols:logout" className="h-5 w-5" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" className="block" onClick={closeMobileMenu}>
                    <Button variant="outline" size="sm" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/sign-up" className="block" onClick={closeMobileMenu}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Create an account
                    </Button>
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Drawer footer — theme toggle */}
          <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <ModeToggle />
          </div>
        </aside>
      </div>
    </>
  );
};

export default Header;
