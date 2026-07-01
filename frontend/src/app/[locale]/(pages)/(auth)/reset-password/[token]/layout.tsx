import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your Minecraft Stats account.",
  robots: {
    index: false, // Pages liées à l'authentification ne doivent pas être indexées
    follow: true,
  },
  openGraph: {
    title: "Reset password - Minecraft Stats",
    description: "Choose a new password for your Minecraft Stats account",
    type: "website",
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
