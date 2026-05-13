"use client";

import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import RestrictedWidthLayout from "../restricted-width-layout";
import { getClientBackendUrl } from "@/lib/domain";

const linkClass = "text-sm text-muted-foreground hover:text-foreground transition-colors";
const sectionTitleClass = "text-xs font-semibold uppercase tracking-wider text-foreground";
const socialIconClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors";

const Footer = () => {
  const isMinecraftStatsDomain =
    typeof window !== "undefined" && window.location.hostname.endsWith("minecraft-stats.com");
  const backendUrl = getClientBackendUrl();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-stats-blue-50 dark:bg-stats-blue-1050">
      <RestrictedWidthLayout className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src={MinecraftStatsLogo} alt="" width={28} height={28} />
              <span className="text-base font-bold text-foreground">Minecraft Stats</span>
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">
              The free, open-source Minecraft server directory with real-time player statistics and historical
              data.
            </p>
            <div className="flex items-center gap-1">
              <Link
                href="https://github.com/Sportek/minecraft-stats"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className={socialIconClass}
              >
                <Icon icon="mdi:github" className="h-5 w-5" />
              </Link>
              <Link
                href="https://discord.gg/Ru9fecKwPn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className={socialIconClass}
              >
                <Icon icon="mdi:discord" className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <nav aria-label="Product" className="space-y-4">
            <h3 className={sectionTitleClass}>Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className={linkClass}>
                  All servers
                </Link>
              </li>
              <li>
                <Link href="/account/add-server" className={linkClass}>
                  Add a server
                </Link>
              </li>
              <li>
                <Link href="/blog" className={linkClass}>
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/partners" className={linkClass}>
                  Partners
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources" className="space-y-4">
            <h3 className={sectionTitleClass}>Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`${backendUrl}/docs`} className={linkClass}>
                  API documentation
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/Sportek/minecraft-stats"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href="https://discord.gg/Ru9fecKwPn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Community
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company" className="space-y-4">
            <h3 className={sectionTitleClass}>Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/cgu" className={linkClass}>
                  Terms of service
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom strip */}
        <div className="mt-12 flex flex-col-reverse items-center gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {currentYear} Minecraft Stats. Not affiliated with Mojang.</p>
          <p className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <Icon icon="ic:round-favorite" className="h-3.5 w-3.5 text-destructive" />
            <span>by</span>
            <Link
              href="https://sportek.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-accent transition-colors"
            >
              Sportek
            </Link>
          </p>
        </div>

        {isMinecraftStatsDomain && (
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Domain name donated by{" "}
            <Link
              href="https://pol.tf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Pol Marnette
            </Link>
          </p>
        )}
      </RestrictedWidthLayout>
    </footer>
  );
};

export default Footer;
