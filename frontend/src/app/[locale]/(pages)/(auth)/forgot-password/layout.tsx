import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Minecraft Stats password.",
  robots: {
    index: false, // Pages liées à l'authentification ne doivent pas être indexées
    follow: true,
  },
  openGraph: {
    title: "Forgot password - Minecraft Stats",
    description: "Reset your Minecraft Stats password",
    type: "website",
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
