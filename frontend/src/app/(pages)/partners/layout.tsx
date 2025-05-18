import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://minecraft-stats.com";

export const metadata: Metadata = {
  title: "Partners - Minecraft Server Stats",
  description:
    "Discover our trusted partners offering premium tools and services for Minecraft servers. From server management to custom plugins, our partners provide essential resources to enhance your server's performance and user experience.",
  keywords: [
    "minecraft server partners",
    "minecraft server tools",
    "server management",
    "minecraft plugins",
    "server optimization",
    "minecraft services",
  ].join(", "),
  openGraph: {
    title: "Partners - Minecraft Server Stats",
    description:
      "Discover our trusted partners offering premium tools and services for Minecraft servers. From server management to custom plugins, our partners provide essential resources to enhance your server's performance and user experience.",
    type: "website",
    siteName: "Minecraft Server Stats",
    images: [
      {
        url: "/images/minecraft-stats/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Minecraft Server Stats Partners",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partners - Minecraft Server Stats",
    description: "Discover our trusted partners offering premium tools and services for Minecraft servers.",
    images: ["/images/minecraft-stats/og-image.webp"],
  },
  alternates: {
    canonical: `${baseUrl}/partners`,
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 