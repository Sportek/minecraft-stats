"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/contexts/auth";
import { ServersProvider } from "@/contexts/servers";
import { FavoriteProvider } from "@/contexts/favorite";
import { ThemeProvider } from "@/components/dark-mode/provider";
import Header from "@/components/header";
import Footer from "@/components/footer";
import RestrictedWidthLayout from "@/components/restricted-width-layout";
import { Toaster } from "@/components/ui/toaster";
import Metrics from "@/components/metrics";
import CheatCodeComponent from "./_cheatcode";
import { useEffect, useState } from "react";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <SpeedInsights />
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem 
        disableTransitionOnChange
      >
        <AuthProvider>
          <ServersProvider>
            <FavoriteProvider>
              <CheatCodeComponent />
              <Header />
              <Toaster />
              <div className="flex-1 flex flex-col items-center justify-center text-stats-blue-1050 dark:text-stats-blue-50 bg-stats-blue-50 dark:bg-stats-blue-1050">
                <RestrictedWidthLayout className="flex-1 flex flex-col">{children}</RestrictedWidthLayout>
                <Metrics />
              </div>
              <Footer />
            </FavoriteProvider>
          </ServersProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
} 