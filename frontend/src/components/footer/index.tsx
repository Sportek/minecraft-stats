"use client";

import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import RestrictedWidthLayout from "../restricted-width-layout";
import { Button } from "../ui/button";

const Footer = () => {
  return (
    <div className="flex flex-col items-center gap-4 py-4 bg-zinc-200">
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
              <Button className="w-full">Add Your Server</Button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-md font-bold">RESSOURCES</div>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="https://github.com/Sportek/minecraft-stats" className="text-zinc-600 hover:text-zinc-700">
                GitHub
              </Link>
              <Link href="/api" className="text-zinc-600 hover:text-zinc-700">
                Access to API
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-md font-bold">OTHER</div>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/cgu" className="text-zinc-600 hover:text-zinc-700">
                Terms of Service
              </Link>
              <Link href="/login" className="text-zinc-600 hover:text-zinc-700">
                Login
              </Link>
              <Link href="/sign-up" className="text-zinc-600 hover:text-zinc-700">
                Register
              </Link>
            </div>
          </div>
        </div>
        <hr className="w-full h-[2px] bg-zinc-400" />
        <div className="flex flex-row items-center justify-center w-full">
          <div className="text-xs text-zinc-500">
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
                <Link href="https://sportek.dev" className="text-zinc-600 hover:text-zinc-700">
                  Sportek
                </Link>
                <div>aka</div>
                <Link href="https://gabriel-landry.dev" className="text-zinc-600 hover:text-zinc-700">
                  Gabriel Landry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RestrictedWidthLayout>
    </div>
  );
};

export default Footer;
