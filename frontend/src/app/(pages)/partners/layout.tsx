import { Metadata } from "next";
import { getDomainConfig } from "@/lib/domain-server";

export const generateMetadata = async (): Promise<Metadata> => {
  const { baseUrl } = await getDomainConfig();

  return {
    title: "Partners - Minecraft Server Stats",
    description:
      "Discover our trusted partners offering premium tools and services for Minecraft servers. From server management to voting platforms, our partners provide essential resources to enhance your server's performance and visibility.",
    keywords: [
      "minecraft server partners",
      "minecraft server tools",
      "server management",
      "minecraft server list",
      "server voting",
      "minecraft services",
    ].join(", "),
    openGraph: {
      title: "Partners - Minecraft Server Stats",
      description:
        "Discover our trusted partners offering premium tools and services for Minecraft servers. From server management to voting platforms, our partners provide essential resources.",
      type: "website",
      siteName: "Minecraft Stats",
      url: `${baseUrl}/partners`,
      images: [
        {
          url: "/images/minecraft-stats/og-image.webp",
          width: 1200,
          height: 630,
          alt: "Minecraft Stats Partners",
        },
      ],
      locale: "en_US",
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
    robots: {
      index: true,
      follow: true,
    },
  };
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 