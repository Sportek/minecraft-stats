import { Category, Server } from "@/types/server";
import Script from "next/script";

interface ServerStructuredDataProps {
  server: Server;
  categories: Category[];
  playerCount: number;
  maxPlayers?: number;
  lastStatsAt?: Date;
}

export function ServerStructuredData({
  server,
  categories,
  playerCount,
  maxPlayers = 0,
  lastStatsAt,
}: Readonly<ServerStructuredDataProps>) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://minecraft-stats.fr";
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://api.minecraft-stats.fr";

  const slug = server.name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${server.name} - Minecraft Server Stats`,
    description: `Statistics and analytics for ${server.name} Minecraft server. Currently ${playerCount} players online.`,
    url: `${baseUrl}/servers/${server.id}/${slug}`,
    image: `${backendUrl}${server.imageUrl}.webp`,
    datePublished: server.createdAt,
    dateModified: lastStatsAt ?? server.createdAt,
    mainEntity: {
      "@type": "Game",
      name: server.name,
      applicationCategory: "Game Server",
      gamePlatform: "Minecraft",
      genre: categories.map((c) => c.name),
      numberOfPlayers: {
        "@type": "QuantitativeValue",
        value: playerCount,
        maxValue: maxPlayers || undefined,
      },
      url: `${baseUrl}/servers/${server.id}/${slug}`,
      image: `${backendUrl}${server.imageUrl}.webp`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Servers",
          item: `${baseUrl}/servers`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: server.name,
          item: `${baseUrl}/servers/${server.id}/${slug}`,
        },
      ],
    },
  };

  return (
    <Script
      id={`structured-data-${server.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface WebsiteStructuredDataProps {
  totalServers?: number;
  totalPlayers?: number;
}

export function WebsiteStructuredData({ totalServers, totalPlayers }: WebsiteStructuredDataProps = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://minecraft-stats.fr";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Minecraft Stats",
    description:
      "Track and analyze Minecraft server statistics. Monitor player counts, growth trends, and server performance in real-time.",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Minecraft Stats",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/minecraft-stats/logo.svg`,
      },
    },
  };

  // Add aggregate data if provided
  if (totalServers || totalPlayers) {
    Object.assign(structuredData, {
      about: {
        "@type": "Thing",
        name: "Minecraft Server Statistics",
        description: `Tracking ${totalServers || "multiple"} Minecraft servers with ${
          totalPlayers || "thousands of"
        } players.`,
      },
    });
  }

  return (
    <Script
      id="website-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface OrganizationStructuredDataProps {
  name?: string;
}

export function OrganizationStructuredData({ name = "Minecraft Stats" }: OrganizationStructuredDataProps = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://minecraft-stats.fr";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: baseUrl,
    logo: `${baseUrl}/images/minecraft-stats/logo.svg`,
    sameAs: [
      // Add social media links here when available
      // 'https://twitter.com/minecraftstats',
      // 'https://github.com/yourusername/minecraft-stats',
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      url: baseUrl,
    },
  };

  return (
    <Script
      id="organization-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
