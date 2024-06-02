"use client";
import { useAuth } from "@/contexts/auth";
import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
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
const Header = () => {
  const [activeTab, setActiveTab] = useState("all-servers");
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayUserSection = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarImage src={user?.avatarUrl ?? ""} alt={user?.username ?? "User Avatar"} />
            <AvatarFallback className="bg-stats-blue-900 text-stats-blue-0 text-sm font-semibold">
              {user?.username?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          <DropdownMenuLabel className="text-sm font-semibold">
            <div className="flex flex-row items-center">
              <Icon icon="material-symbols:person" className="w-6 h-6 mr-2" />
              {user?.username.toUpperCase()}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="hover:cursor-pointer text-sm font-semibold"
            onClick={() => router.push("/account/settings")}
          >
            <Icon icon="material-symbols:settings-account-box" className="w-6 h-6 mr-2" />
            PROFILE
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:cursor-pointer text-sm font-semibold"
            onClick={() => router.push("/account/add-server")}
          >
            <Icon icon="material-symbols:add-box" className="w-6 h-6 mr-2" />
            ADD SERVER
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="hover:cursor-pointer text-sm font-semibold text-red-800"
            onClick={() => logout()}
          >
            <Icon icon="material-symbols:logout" className="w-6 h-6 mr-2" />
            LOGOUT
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const displayMobileUserSection = () => {
    return (
      <div className="flex flex-col items-center gap-4 bg-zinc-200 p-4 rounded-md w-[90%]">
        <div className="flex flex-row items-center gap-4 w-full">
          <Avatar>
            <AvatarImage src={user?.avatarUrl ?? ""} alt={user?.username ?? "User Avatar"} />
            <AvatarFallback className="bg-stats-blue-900 text-stats-blue-0 text-sm font-semibold">
              {user?.username?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center gap-2">
            <div className="font-semibold text-stats-blue-1050">{user?.username.toUpperCase()}</div>
          </div>
        </div>
        <button
          className="bg-stats-blue-1000 text-stats-blue-0 p-2 rounded-md flex flex-row items-center gap-2 w-full"
          onClick={() => {
            logout();
            setIsMobileMenuOpen(false);
          }}
        >
          <Icon icon="material-symbols:logout" className="w-6 h-6 mr-2" />
          LOGOUT
        </button>
        <button
          className="bg-stats-blue-1000 text-stats-blue-0 p-2 rounded-md flex flex-row items-center gap-2 w-full"
          onClick={() => {
            router.push("/account/settings");
            setIsMobileMenuOpen(false);
          }}
        >
          <Icon icon="material-symbols:settings-account-box" className="w-6 h-6 mr-2" />
          PROFILE
        </button>
      </div>
    );
  };

  const mobileMenu = () => {
    return (
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden bg-zinc-100 flex flex-col items-center gap-4 z-50">
        <div className="flex flex-row items-center p-4 bg-stats-blue-1050 w-full justify-between">
          <Link href="/" className="flex flex-row items-center gap-2">
            <Image src={MinecraftStatsLogo} alt="logo" width={32} height={32} />
            <div className="text-2xl font-bold">Minecraft Stats</div>
          </Link>
          <button className="md:hidden flex flex-row items-center gap-8" onClick={() => setIsMobileMenuOpen(false)}>
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>
        {user?.username ? (
          displayMobileUserSection()
        ) : (
          <div className="flex flex-col items-center gap-4 w-[90%] bg-zinc-200 rounded-md text-stats-blue-1050">
            <Link
              href="/login"
              className="text-sm font-bold p-2 rounded-md transition-all duration-200 ease-in-out bg-zinc-200 text-stats-blue-1050 w-full text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              LOGIN
            </Link>
          </div>
        )}
        <div className="flex flex-col items-center gap-4 w-[90%] bg-zinc-200 rounded-md text-stats-blue-1050">
          <Link
            href="/"
            className="text-sm font-bold p-2 rounded-md transition-all duration-200 ease-in-out bg-zinc-200 text-stats-blue-1050 w-full text-center"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            ALL SERVERS
          </Link>
        </div>
        <div className="flex flex-col items-center gap-4 w-[90%] ">
          <Link
            href="/api"
            className="text-sm font-bold p-2 rounded-md transition-all duration-200 ease-in-out bg-zinc-200 text-stats-blue-1050 w-full text-center"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            API
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full py-4 bg-stats-blue-1050 text-stats-blue-0 flex flex-col items-center justify-center">
      <RestrictedWidthLayout className="flex flex-row justify-between">
        <div className="flex flex-row items-center">
          <Link href="/" className="flex flex-row items-center gap-2">
            <Image src={MinecraftStatsLogo} alt="logo" width={32} height={32} />
            <div className="text-2xl font-bold">Minecraft Stats</div>
          </Link>
        </div>
        <div className="hidden flex-row items-center gap-8 md:flex">
          <Link
            href="/"
            className={cn(
              "text-sm font-bold p-2 rounded-md transition-all duration-200 ease-in-out",
              activeTab === "all-servers" ? "bg-stats-blue-1000" : null
            )}
            onClick={() => setActiveTab("all-servers")}
          >
            ALL SERVERS
          </Link>
          <Link
            href="/api"
            className={cn(
              "text-sm font-bold p-2 rounded-md transition-all duration-200 ease-in-out",
              activeTab === "api" ? "bg-stats-blue-1000" : null
            )}
            onClick={() => setActiveTab("api")}
          >
            API
          </Link>
          {user?.username ? (
            displayUserSection()
          ) : (
            <Link
              href="/login"
              className={cn(
                "text-sm font-bold p-2 rounded-md transition-all duration-200 ease-in-out",
                activeTab === "login" ? "bg-stats-blue-1000" : null
              )}
              onClick={() => setActiveTab("login")}
            >
              LOGIN
            </Link>
          )}
        </div>
        <button
          className="md:hidden flex flex-row items-center gap-8"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Icon icon="material-symbols:menu" className="w-6 h-6" />
        </button>
      </RestrictedWidthLayout>
      {isMobileMenuOpen ? mobileMenu() : null}
    </div>
  );
};

export default Header;
