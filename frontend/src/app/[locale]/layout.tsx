import UmamiScript from "@/components/umami-script";
import { routing } from "@/i18n/routing";
import { buildAlternates, getDomainConfig, getLocaleFreePathname, getOpenGraphLocales } from "@/lib/domain-server";
import { cn } from "@/lib/utils";
import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import ClientLayout from "./client-layout";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["sans-serif"],
  weight: ["400", "500", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const { baseUrl, googleSearchId } = await getDomainConfig();
  const path = await getLocaleFreePathname();
  const { canonical, languages } = buildAlternates(locale, path);
  const og = getOpenGraphLocales(locale);
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: "%s | Minecraft Stats",
      default: t("meta.title"),
    },
    description: t("meta.description"),
    keywords: t("meta.keywords"),
    authors: [{ name: "Sportek | Gabriel Landry" }],
    creator: "Sportek | Gabriel Landry",
    publisher: "Minecraft Stats",
    category: "Gaming",
    applicationName: "Minecraft Stats",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      siteName: "Minecraft Stats",
      title: t("meta.ogTitle"),
      description: t("meta.ogDescription"),
      images: [
        {
          url: "/images/minecraft-stats/og-image.webp",
          width: 1200,
          height: 630,
          alt: "Minecraft Stats - Server Performance Tracking & Analytics",
          type: "image/webp",
        },
      ],
      locale: og.locale,
      alternateLocale: og.alternateLocale,
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.twitterTitle"),
      description: t("meta.twitterDescription"),
      images: ["/images/minecraft-stats/og-image.webp"],
      creator: "@MinecraftStats",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical,
      languages,
      types: {
        "application/rss+xml": `${baseUrl}/feed.xml`,
      },
    },
    verification: {
      google: googleSearchId,
    },
  };
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for this layout and its children.
  setRequestLocale(locale);
  const messages = await getMessages();

  // Only mount GTM when a container id is configured. Otherwise the component
  // requests `gtm.js?id=undefined`, which Google answers with a 400 (the console
  // error seen in Lighthouse) and ships a heavy script for nothing.
  const gtmId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER;

  return (
    <html lang={locale} suppressHydrationWarning>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <head>
        <link rel="preconnect" href="https://www.clarity.ms" crossOrigin="" />
        <link rel="preconnect" href="https://cloud.umami.is" crossOrigin="" />
        <link rel="dns-prefetch" href="https://scripts.clarity.ms" />
        <UmamiScript />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/images/minecraft-stats/logo.svg" />
      </head>
      <body className={cn(inter.className, "h-full min-h-screen w-full flex flex-col")}>
        <NextIntlClientProvider messages={messages}>
          <ClientLayout>{children}</ClientLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
