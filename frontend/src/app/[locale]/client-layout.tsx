"use client";

import AnalyticsTracker from "@/components/analytics/analytics-tracker";
import ConsentBanner from "@/components/consent/consent-banner";
import { ThemeProvider } from "@/components/dark-mode/provider";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Metrics from "@/components/metrics";
import RestrictedWidthLayout from "@/components/restricted-width-layout";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth";
import { ConsentProvider } from "@/contexts/consent";
import { FavoriteProvider } from "@/contexts/favorite";
import { ServersProvider } from "@/contexts/servers";
import { SWRConfig } from "swr";
import { fetcher } from "@/app/_cheatcode";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
        errorRetryCount: 2,
      }}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <ConsentProvider>
            <ServersProvider>
              <FavoriteProvider>
                <Header />
                <Toaster />
                <div className="flex-1 flex flex-col items-center bg-canvas text-foreground">
                  <RestrictedWidthLayout className="flex-1 flex flex-col">{children}</RestrictedWidthLayout>
                  <Metrics />
                </div>
                <Footer />
                <AnalyticsTracker />
                <ConsentBanner />
              </FavoriteProvider>
            </ServersProvider>
          </ConsentProvider>
        </AuthProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
