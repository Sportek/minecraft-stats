"use client";
import { useAuth } from "@/contexts/auth";
import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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

  return (
    <div className="w-full flex flex-row justify-between p-4 bg-stats-blue-1050 text-stats-blue-0">
      {/* Left side */}
      <div className="flex flex-row items-center">
        <Link href="/" className="flex flex-row items-center gap-2">
          <Image src={MinecraftStatsLogo} alt="logo" width={32} height={32} />
          <div className="text-2xl font-bold">Minecraft Stats</div>
        </Link>
      </div>

      {/* Right side */}
      <div className="flex flex-row items-center gap-8">
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
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                <AvatarImage src={user.avatarUrl ?? ""} alt={user.username ?? ""} />
                <AvatarFallback>{user.username?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="hover:cursor-pointer" onClick={() => logout()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
    </div>
  );
};

export default Header;
