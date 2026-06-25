import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Create your free Minecraft Stats account to add your servers, track your statistics, and analyze your community's growth.",
  keywords: "sign up minecraft stats, create minecraft server account, register minecraft, new account",
  robots: {
    index: false, // Pages d'inscription ne doivent pas être indexées
    follow: true,
  },
  openGraph: {
    title: "Sign up - Minecraft Stats",
    description: "Create your free account to manage your Minecraft servers",
    type: "website",
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
