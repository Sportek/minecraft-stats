import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Minecraft Stats to manage your Minecraft servers and track your player statistics in real time.",
  keywords: "sign in minecraft stats, minecraft server login, minecraft account, server authentication",
  robots: {
    index: false, // Pages de connexion ne doivent pas être indexées
    follow: true,
  },
  openGraph: {
    title: "Sign in - Minecraft Stats",
    description: "Sign in to manage your Minecraft servers",
    type: "website",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
