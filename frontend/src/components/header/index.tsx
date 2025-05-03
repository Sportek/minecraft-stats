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

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link href={href} className="text-sm font-medium text-zinc-900 dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors">
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="text-red-500">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="w-full">
      <RestrictedWidthLayout className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src={MinecraftStatsLogo} alt="Minecraft Stats Logo" width={32} height={32} />
          <span className="text-lg font-bold text-zinc-900 dark:text-white">Minecraft Stats</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <ModeToggle />
          <NavLink href="/account/add-server" label="Add Your Server" />
          <NavLink href="/" label="All Servers" />
          <NavLink href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/docs`} label="API" />
          {user?.username ? displayUserMenu() : <NavLink href="/login" label="Login" />}
        </div>

        <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen((prev) => !prev)}>
          <Icon icon="material-symbols:menu" className="w-6 h-6" />
        </button>
      </RestrictedWidthLayout>

      {isMobileMenuOpen && (
        <div className="md:hidden px-6 py-4 space-y-4 bg-white dark:bg-zinc-900 border-t">
          <NavLink href="/account/add-server" label="Add Your Server" />
          <NavLink href="/" label="All Servers" />
          <NavLink href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/docs`} label="API" />
          {user?.username ? displayUserMenu() : <NavLink href="/login" label="Login" />}
        </div>
      )}
    </header>
  );
};

export default Header;
