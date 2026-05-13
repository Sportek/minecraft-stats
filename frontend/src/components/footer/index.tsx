"use client";

import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import RestrictedWidthLayout from "../restricted-width-layout";
import { Button } from "../ui/button";
import { getClientBackendUrl } from "@/lib/domain";

const footerLinkClass = "text-muted-foreground hover:text-foreground transition-colors";

const Footer = () => {
  const isMinecraftStatsDomain =
    typeof window !== "undefined" && window.location.hostname.endsWith("minecraft-stats.com");
  const backendUrl = getClientBackendUrl();

  return (
    <div className="flex flex-col items-center gap-4 py-4 bg-stats-blue-50 dark:bg-stats-blue-1050 border-t border-border/60">
      <RestrictedWidthLayout className="gap-4 flex flex-col items-center justify-center">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-row items-center justify-start w-full gap-2">
              <Image src={MinecraftStatsLogo} alt="Minecraft Stats Logo" width={32} height={32} />
              <div className="text-2xl font-bold text-foreground">Minecraft Stats</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Minecraft Stats is a free service that allows you to list the connection statistics of various existing
                Minecraft servers. You can easily add a Minecraft server and get real-time connection statistics.
              </div>
              <Link href="/account/add-server" className="w-full">
                <Button className="w-full">Add Your Server</Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-md font-bold text-foreground">RESSOURCES</div>
            <div className="flex flex-col gap-2 text-sm *:py-2">
              <Link href="https://github.com/Sportek/minecraft-stats" className={footerLinkClass}>
                GitHub
              </Link>
              <Link href={`${backendUrl}/docs`} className={footerLinkClass}>
                API Documentation
              </Link>
              <Link href="/partners" className={footerLinkClass}>
                Partners
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-md font-bold text-foreground">OTHER</div>
            <div className="flex flex-col gap-2 text-sm *:py-2">
              <Link
                href="https://discord.gg/Ru9fecKwPn"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLinkClass}
              >
                Discord Server
              </Link>
              <Link href="/about" className={footerLinkClass}>
                About
              </Link>
              <Link href="/cgu" className={footerLinkClass}>
                Terms of Service
              </Link>
              <Link href="/login" className={footerLinkClass}>
                Login
              </Link>
              <Link href="/sign-up" className={footerLinkClass}>
                Register
              </Link>
            </div>
          </div>
        </div>
        <hr className="w-full h-px bg-border border-0" />
        <div className="flex flex-row items-center justify-center w-full">
          <div className="text-xs text-muted-foreground">
            <div className="flex flex-col items-center justify-center">
              <div>
                Copyright © 2024 Minecraft Stats. All Rights Reserved. We aren&apos;t affiliated or officially connected
                with Mojang.
              </div>
              <div className="flex flex-row items-center justify-center gap-2">
                <div>Made with</div>
                <div className="text-destructive animate-pulse">
                  <Icon icon="ic:round-favorite" className="w-4 h-4" />
                </div>
                <div>by</div>
                <Link href="https://sportek.dev" className={footerLinkClass}>
                  Sportek
                </Link>
                <div>aka</div>
                <Link href="https://gabriel-landry.dev" className={footerLinkClass}>
                  Gabriel Landry
                </Link>
              </div>
              {isMinecraftStatsDomain && (
                <div>
                  Donation of the current domain name by{" "}
                  <Link href="https://pol.tf" className={footerLinkClass}>
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
