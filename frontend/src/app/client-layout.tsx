"use client";

import { ThemeProvider } from "@/components/dark-mode/provider";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Metrics from "@/components/metrics";
import RestrictedWidthLayout from "@/components/restricted-width-layout";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth";
import { FavoriteProvider } from "@/contexts/favorite";
import { ServersProvider } from "@/contexts/servers";
import { useEffect, useState } from "react";
import CheatCodeComponent from "./_cheatcode";

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
  );
}
