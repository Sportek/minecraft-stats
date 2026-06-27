"use client";

import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import RestrictedWidthLayout from "../restricted-width-layout";
import BrandLogo from "../brand-logo";
import { getClientBackendUrl } from "@/lib/domain";

const linkClass = "text-sm text-muted-foreground hover:text-foreground transition-colors";
const sectionTitleClass = "text-xs font-semibold uppercase tracking-wider text-foreground";
const socialIconClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors";

const Footer = () => {
  const t = useTranslations("Footer");
  const isMinecraftStatsDomain =
    typeof window !== "undefined" && window.location.hostname.endsWith("minecraft-stats.com");
  const backendUrl = getClientBackendUrl();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <RestrictedWidthLayout className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <BrandLogo />
            <p className="max-w-sm text-sm text-muted-foreground">{t("tagline")}</p>
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
          <nav aria-label={t("sections.product")} className="space-y-4">
            <h3 className={sectionTitleClass}>{t("sections.product")}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className={linkClass}>
                  {t("links.allServers")}
                </Link>
              </li>
              <li>
                <Link href="/account/add-server" className={linkClass}>
                  {t("links.addServer")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className={linkClass}>
                  {t("links.blog")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label={t("sections.resources")} className="space-y-4">
            <h3 className={sectionTitleClass}>{t("sections.resources")}</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`${backendUrl}/docs`} className={linkClass}>
                  {t("links.apiDocs")}
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/Sportek/minecraft-stats"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {t("links.github")}
                </Link>
              </li>
              <li>
                <Link
                  href="https://discord.gg/Ru9fecKwPn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {t("links.community")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label={t("sections.company")} className="space-y-4">
            <h3 className={sectionTitleClass}>{t("sections.company")}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className={linkClass}>
                  {t("links.about")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  {t("links.contact")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  {t("links.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/cgu" className={linkClass}>
                  {t("links.terms")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom strip */}
        <div className="mt-12 flex flex-col-reverse items-center gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>{t("copyright", { year: currentYear })}</p>
          <p className="flex items-center gap-1.5">
            <span>{t("craftedWith")}</span>
            <Icon icon="ic:round-favorite" className="h-3.5 w-3.5 text-destructive" />
            <span>{t("craftedBy")}</span>
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
            {t("domainDonatedBy")}{" "}
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
