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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Minecraft-stats",
  description:
    "Minecraft Stats est un service gratuit qui permet de répertorier les statistiques de connections des différents serveurs Minecraft existants. Vous pouvez ajouter facilement un serveur Minecraft et obtenir des statistiques de connections en temps réel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen w-screen flex flex-col bg-zinc-100 text-stats-blue-1050")}>
        <AuthProvider>
          <ServersProvider>
            <CheatCodeComponent />
            <div className="bg-gradient-to-br from-stats-blue-550 to-stats-blue-950 text-white text-center p-2">
              This website is currently in beta mode. Please report any bug or issue you encounter.
            </div>
            <Header />
            <Toaster />
            <div className="flex-1 flex flex-col items-center justify-center">
              <RestrictedWidthLayout className="flex-1 flex flex-col">{children}</RestrictedWidthLayout>
            </div>
            <Footer />
          </ServersProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
