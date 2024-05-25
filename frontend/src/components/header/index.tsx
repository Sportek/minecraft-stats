"use client";
import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
const Header = () => {
  const [activeTab, setActiveTab] = useState("all-servers");

  return (
    <div className="w-full flex flex-row justify-between p-4 bg-stats-blue-1050 text-stats-blue-0">
      {/* Left side */}
      <div className="flex flex-row items-center gap-2">
        <Image src={MinecraftStatsLogo} alt="logo" width={32} height={32} />
        <div className="text-2xl font-bold">Minecraft Stats</div>
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
      </div>
    </div>
  );
};

export default Header;
