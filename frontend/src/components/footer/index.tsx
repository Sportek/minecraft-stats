"use client";

import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import RestrictedWidthLayout from "../restricted-width-layout";
import { Button } from "../ui/button";
import { getClientBackendUrl } from "@/lib/domain";

const Footer = () => {
  const isMinecraftStatsDomain =
    typeof window !== "undefined" && window.location.hostname.endsWith("minecraft-stats.com");
  const backendUrl = getClientBackendUrl();

  return (
    <div className="flex flex-col items-center gap-4 py-4 bg-stats-blue-50 dark:bg-stats-blue-1050">
      <RestrictedWidthLayout className="gap-4 flex flex-col items-center justify-center">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-row items-center justify-start w-full gap-2">
              <Image src={MinecraftStatsLogo} alt="Minecraft Stats Logo" width={32} height={32} />
              <div className="text-2xl font-bold">Minecraft Stats</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm">
                Minecraft Stats is a free service that allows you to list the connection statistics of various existing
                Minecraft servers. You can easily add a Minecraft server and get real-time connection statistics.
              </div>
              <Link href="/account/add-server" className="w-full">
                <Button className="w-full">Add Your Server</Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-md font-bold">RESSOURCES</div>
            <div className="flex flex-col gap-2 text-sm *:py-1">
              <Link
                href="https://github.com/Sportek/minecraft-stats"
                className="text-zinc-700 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                GitHub
              </Link>
              <Link
                href={`${backendUrl}/docs`}
                className="text-zinc-700 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                API Documentation
              </Link>
              <Link
                href="/partners"
                className="text-zinc-700 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                Partners
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-md font-bold">OTHER</div>
            <div className="flex flex-col gap-2 text-sm *:py-1">
              <Link
                href="https://discord.gg/Ru9fecKwPn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                Discord Server
              </Link>
              <Link
                href="/cgu"
                className="text-zinc-700 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                Terms of Service
              </Link>
              <Link
                href="/login"
                className="text-zinc-700 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                className="text-zinc-700 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
        <hr className="w-full h-[2px] bg-zinc-400" />
        <div className="flex flex-row items-center justify-center w-full">
          <div className="text-xs text-zinc-700">
            <div className="flex flex-col items-center justify-center">
              <div>
                Copyright © 2024 Minecraft Stats. All Rights Reserved. We aren&apos;t affiliated or officially connected
                with Mojang.
              </div>
              <div className="flex flex-row items-center justify-center gap-2">
                <div>Made with</div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                  className="text-red-500"
                >
                  <Icon icon="ic:round-favorite" className="w-4 h-4" />
                </motion.div>
                <div>by</div>
                <Link
                  href="https://sportek.dev"
                  className="text-zinc-700 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"
                >
                  Sportek
                </Link>
                <div>aka</div>
                <Link
                  href="https://gabriel-landry.dev"
                  className="text-zinc-700 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"
                >
                  Gabriel Landry
                </Link>
              </div>
              {isMinecraftStatsDomain && (
                <div>
                  Donation of the current domain name by{" "}
                  <Link
                    href="https://pol.tf"
                    className="text-zinc-700 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"
                  >
                    Pol Marnette
                  </Link>{" "}
                  who had a similar project.
                </div>
              )}
            </div>
          </div>
        </div>
      </RestrictedWidthLayout>
    </div>
  );
};

export default Footer;
