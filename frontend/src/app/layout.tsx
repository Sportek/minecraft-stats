import Footer from "@/components/footer";
import Header from "@/components/header";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      <body className={cn(inter.className, "w-full min-h-screen flex flex-col bg-zinc-100")}>
        <Header />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
