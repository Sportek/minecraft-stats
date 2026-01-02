import UmamiScript from "@/components/umami-script";
import { getAlternateLanguages, getCurrentLocale, getDomainConfig } from "@/lib/domain-server";
import { cn } from "@/lib/utils";
import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["sans-serif"],
  weight: ["400", "500", "700"],
});

export const generateMetadata = async (): Promise<Metadata> => {
  const { baseUrl, googleSearchId } = await getDomainConfig();
  const locale = await getCurrentLocale();
  const alternateLanguages = getAlternateLanguages();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: "%s | Minecraft Stats",
      default: "Minecraft Stats - Track & Analyze Your Server's Performance",
    },
    description:
      "Free Minecraft server statistics and analytics platform. Track player counts, monitor growth trends, and analyze server performance in real-time. Perfect for server owners and administrators looking to understand their community.",
    keywords: [
      "minecraft server stats",
      "minecraft server tracking",
      "player count tracker",
      "server performance",
      "minecraft analytics",
      "server monitoring",
      "minecraft statistics",
      "server analytics dashboard",
      "real-time server stats",
      "minecraft server growth",
    ].join(", "),
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
      title: "Minecraft Stats - Track & Analyze Your Server's Performance",
      description:
        "Free Minecraft server analytics platform. Monitor player counts, track growth trends, and analyze server performance in real-time. Join thousands of server owners.",
      images: [
        {
          url: "/images/minecraft-stats/og-image.webp",
          width: 1200,
          height: 630,
          alt: "Minecraft Stats - Server Performance Tracking & Analytics",
          type: "image/webp",
        },
      ],
      locale: locale.replace("-", "_"), // OpenGraph uses underscore format
    },
    twitter: {
      card: "summary_large_image",
      title: "Minecraft Stats - Track & Analyze Your Server's Performance",
      description:
        "Free Minecraft server analytics. Monitor player counts, track growth trends, and analyze performance in real-time.",
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
      canonical: baseUrl,
      languages: alternateLanguages,
    },
    verification: {
      google: googleSearchId,
    },
  };
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();
  const htmlLang = locale.split("-")[0];

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER} />
      <head>
        <UmamiScript />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/images/minecraft-stats/logo.svg" />
      </head>
      <body className={cn(inter.className, "h-full min-h-screen w-screen flex flex-col")}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
