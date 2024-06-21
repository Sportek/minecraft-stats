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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
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
        className={cn(inter.className, "h-full min-h-screen w-screen flex flex-col bg-zinc-100 dark:bg-zinc-900 text-stats-blue-1050 dark:text-stats-blue-50")}
      >
        <SpeedInsights />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ServersProvider>
              <FavoriteProvider>
                <CheatCodeComponent />
                <div className="bg-gradient-to-br from-stats-blue-550 to-stats-blue-950 text-white text-center p-2">
                  This website is currently in beta mode. Please report any bug or issue you encounter.
                </div>
                <Header />
                <Toaster />
                <div className="flex-1 flex flex-col items-center justify-center">
                  <RestrictedWidthLayout className="flex-1 flex flex-col">{children}</RestrictedWidthLayout>
                  <Metrics />
                </div>
                <Footer />
              </FavoriteProvider>
            </ServersProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
