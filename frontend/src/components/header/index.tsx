"use client";
import { useAuth } from "@/contexts/auth";
import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import RestrictedWidthLayout from "../restricted-width-layout";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ModeToggle } from "../dark-mode/toggle";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { getClientBackendUrl } from "@/lib/domain";

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const backendUrl = getClientBackendUrl();

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className="text-sm font-medium text-zinc-900 dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors"
    >
      {label}
    </Link>
  );

  const MobileNavLink = ({
    href,
    label,
    onClick,
    icon,
  }: {
    href: string;
    label: string;
    onClick?: () => void;
    icon?: string;
  }) => (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors w-full"
      onClick={onClick}
    >
      {icon && <Icon icon={icon} className="w-5 h-5" />}
      {label}
    </Link>
  );

  const displayUserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user?.avatarUrl ?? ""} alt={user?.username ?? "User Avatar"} />
          <AvatarFallback className="bg-stats-blue-900 text-white">{user?.username?.[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="font-semibold text-sm">
          <div className="flex items-center gap-2">
            <Icon icon="material-symbols:person" className="w-5 h-5" />
            {user?.username.toUpperCase()}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/account/settings")}>Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account/add-server")}>Add Server</DropdownMenuItem>
        {user?.role === "admin" && (
          <DropdownMenuItem onClick={() => router.push("/admin/posts")}>Manage Blog</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="text-red-500">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="w-full relative bg-stats-blue-50 dark:bg-stats-blue-1050">
      <RestrictedWidthLayout className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src={MinecraftStatsLogo} alt="Minecraft Stats Logo" width={32} height={32} />
          <span className="text-lg font-bold text-zinc-900 dark:text-white">Minecraft Stats</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <ModeToggle />
          <NavLink href="/account/add-server" label="Add Your Server" />
          <NavLink href="/" label="All Servers" />
          <NavLink href="/blog" label="Blog" />
          <NavLink href={`${backendUrl}/docs`} label="API" />
          {user?.username ? displayUserMenu() : <NavLink href="/login" label="Login" />}
        </div>

        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-zinc-900 dark:text-white" />
          ) : (
            <Icon icon="material-symbols:menu" className="w-6 h-6 text-zinc-900 dark:text-white" />
          )}
        </button>
      </RestrictedWidthLayout>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-200",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-[73px] bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shadow-lg transition-all duration-200",
            isMobileMenuOpen ? "translate-y-0" : "-translate-y-8"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {user?.username && (
            <div className="px-4 py-3 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl ?? ""} alt={user.username} />
                <AvatarFallback className="bg-stats-blue-900 text-white text-sm">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{user.username}</p>
                <p className="text-xs text-zinc-500">Connected</p>
              </div>
              <ModeToggle />
            </div>
          )}

          {!user?.username && (
            <div className="px-4 py-3 flex justify-end border-b border-zinc-200 dark:border-zinc-800">
              <ModeToggle />
            </div>
          )}

          <div className="py-2">
            <MobileNavLink
              href="/account/add-server"
              label="Add Your Server"
              icon="material-symbols:add-circle-outline"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <MobileNavLink
              href="/"
              label="All Servers"
              icon="material-symbols:list"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <MobileNavLink
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/docs`}
              label="API"
              icon="material-symbols:api"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {user?.username ? (
              <>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2" />
                <MobileNavLink
                  href="/account/settings"
                  label="Profile Settings"
                  icon="material-symbols:settings-outline"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                {user?.role === "admin" && (
                  <MobileNavLink
                    href="/admin/posts"
                    label="Manage Blog"
                    icon="material-symbols:article-outline"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors w-full"
                >
                  <Icon icon="material-symbols:logout" className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2" />
                <MobileNavLink
                  href="/login"
                  label="Login"
                  icon="material-symbols:login"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
