import Footer from "@/components/footer";
import Header from "@/components/header";
import RestrictedWidthLayout from "@/components/restricted-width-layout";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth";
import { ServersProvider } from "@/contexts/servers";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import CheatCodeComponent from "./_cheatcode";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Metrics from "@/components/metrics";
import { FavoriteProvider } from "@/contexts/favorite";
import { ThemeProvider } from "@/components/dark-mode/provider";
import ClientLayout from "./client-layout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["sans-serif"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://minecraft-stats.fr'),
  title: {
    template: "%s | Minecraft Stats",
    default: "Minecraft Stats",
  },
  description:
    "Minecraft Stats is a free service that allows you to list the connection statistics of various existing Minecraft servers. You can easily add a Minecraft server and get real-time connection statistics.",
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
