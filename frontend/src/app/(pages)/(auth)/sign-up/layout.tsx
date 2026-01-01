import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription",
  description:
    "Créez votre compte Minecraft Stats gratuit pour ajouter vos serveurs, suivre vos statistiques et analyser la croissance de votre communauté.",
  keywords: "inscription minecraft stats, créer compte serveur minecraft, s'inscrire minecraft, nouveau compte",
  robots: {
    index: false, // Pages d'inscription ne doivent pas être indexées
    follow: true,
  },
  openGraph: {
    title: "Inscription - Minecraft Stats",
    description: "Créez votre compte gratuit pour gérer vos serveurs Minecraft",
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
