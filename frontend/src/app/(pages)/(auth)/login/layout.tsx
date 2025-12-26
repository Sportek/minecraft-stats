import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à Minecraft Stats pour gérer vos serveurs Minecraft et suivre vos statistiques de joueurs en temps réel.",
  keywords: "connexion minecraft stats, login serveur minecraft, compte minecraft, authentification serveur",
  robots: {
    index: false, // Pages de connexion ne doivent pas être indexées
    follow: true,
  },
  openGraph: {
    title: "Connexion - Minecraft Stats",
    description: "Connectez-vous pour gérer vos serveurs Minecraft",
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
