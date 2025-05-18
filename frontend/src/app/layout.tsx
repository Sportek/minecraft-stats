import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";
import UmamiScript from "@/components/umami-script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["sans-serif"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://minecraft-stats.fr"),
  title: {
    template: "%s | Minecraft Stats",
    default: "Minecraft Stats - Track Your Server's Performance",
  },
  description:
    "Minecraft Stats is a free service that allows you to track and analyze your Minecraft server's performance. Monitor player counts, growth trends, and server statistics in real-time. Perfect for server owners and administrators.",
  keywords: [
    "minecraft server stats",
    "minecraft server tracking",
    "player count tracker",
    "server performance",
    "minecraft analytics",
    "server monitoring",
  ].join(", "),
  authors: [{ name: "Sportek | Gabriel Landry" }],
  creator: "Sportek | Gabriel Landry",
  publisher: "Sportek | Gabriel Landry",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Minecraft Stats",
    title: "Minecraft Stats - Track Your Server's Performance",
    description:
      "Monitor your Minecraft server's performance with real-time statistics, player counts, and growth trends. Free service for server owners and administrators.",
    images: [
      {
        url: "/images/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Minecraft Stats - Server Performance Tracking",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minecraft Stats - Track Your Server's Performance",
    description:
      "Monitor your Minecraft server's performance with real-time statistics, player counts, and growth trends.",
    images: ["/images/minecraft-stats/og-image.webp"],
    creator: "@Sportek | Gabriel Landry",
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
    canonical: process.env.NEXT_PUBLIC_BASE_URL ?? "https://minecraft-stats.fr",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <UmamiScript />
      </head>
      <body
        className={cn(inter.className, "h-full min-h-screen w-screen flex flex-col")}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
