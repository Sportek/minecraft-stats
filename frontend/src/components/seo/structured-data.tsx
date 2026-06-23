import { getClientDomainConfig, resolveAssetUrl } from "@/lib/domain";
import { Category, Server } from "@/types/server";
import Script from "next/script";

/**
 * Sérialise un objet JSON-LD pour une insertion sûre dans un <script>.
 * `JSON.stringify` n'échappe ni `<` ni `>` ni `/`, donc une valeur contenant
 * `</script>` (ex. un nom de serveur attaquant-contrôlé) pourrait fermer la
 * balise et injecter du HTML/JS. On neutralise `<`, `>` et `&`.
 */
function toJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

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
  const { baseUrl } = getClientDomainConfig();
  const imageUrl = resolveAssetUrl(`${server.imageUrl}.webp`);

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
    image: imageUrl,
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
      image: imageUrl,
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
      dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
    />
  );
}

interface WebsiteStructuredDataProps {
  totalServers?: number;
  totalPlayers?: number;
}

export function WebsiteStructuredData({ totalServers, totalPlayers }: WebsiteStructuredDataProps = {}) {
  const { baseUrl } = getClientDomainConfig();

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
      dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
    />
  );
}

interface OrganizationStructuredDataProps {
  name?: string;
}

export function OrganizationStructuredData({ name = "Minecraft Stats" }: OrganizationStructuredDataProps = {}) {
  const { baseUrl } = getClientDomainConfig();

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
      dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
    />
  );
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  publishedAt: string;
  updatedAt: string;
  author?: {
    name: string;
  };
}

interface BlogPostStructuredDataProps {
  post: BlogPost;
}

export function BlogPostStructuredData({ post }: Readonly<BlogPostStructuredDataProps>) {
  const { baseUrl } = getClientDomainConfig();
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const inLanguage = baseUrl.includes("minecraft-stats.fr") ? "fr-FR" : "en-US";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    image: post.coverImage
      ? resolveAssetUrl(post.coverImage)
      : `${baseUrl}/images/minecraft-stats/og-image.webp`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author?.name || "Sportek",
    },
    publisher: {
      "@type": "Organization",
      name: "Minecraft Stats",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/minecraft-stats/logo.svg`,
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    url: postUrl,
    articleSection: "Minecraft Server News & Guides",
    inLanguage,
    keywords: "minecraft server, server stats, gaming, minecraft",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
      ],
    },
  };

  return (
    <Script
      id={`blog-post-structured-data-${post.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
    />
  );
}

interface ServerFAQStructuredDataProps {
  server: Server;
  currentPlayers?: number;
  maxPlayers?: number;
}

export function ServerFAQStructuredData({
  server,
  currentPlayers = 0,
  maxPlayers = 0,
}: Readonly<ServerFAQStructuredDataProps>) {
  const faqItems = [
    {
      question: `How do I join the ${server.name} Minecraft server?`,
      answer: `To join ${server.name}, launch Minecraft and use the server address: ${server.address}${
        server.port == 25565 ? "" : `:${server.port}`
      }. Click "Multiplayer" in the main menu, then "Add Server", paste the address, and click "Done" to save. Then select the server and click "Join Server" to connect.`,
    },
    {
      question: `How many players are online on ${server.name}?`,
      answer: `Currently, ${currentPlayers} ${currentPlayers === 1 ? "player is" : "players are"} online on ${
        server.name
      } out of a maximum capacity of ${maxPlayers} players. You can view real-time player statistics and historical data on this page.`,
    },
    {
      question: `What version of Minecraft does ${server.name} support?`,
      answer: server.version
        ? `${server.name} is running Minecraft version ${server.version}. Make sure your Minecraft client is compatible with this version to join the server.`
        : `${server.name} supports multiple Minecraft versions. Check the server information above for the current version details.`,
    },
    {
      question: `Is ${server.name} online and accessible?`,
      answer: `Yes, ${server.name} is currently monitored every 10 minutes. The latest statistics show the server is ${
        currentPlayers > 0 ? "online with active players" : "online"
      }. Historical uptime and player count data is available on this page.`,
    },
    {
      question: `Can I see player statistics for ${server.name}?`,
      answer: `Yes, this page provides comprehensive statistics for ${server.name} including current player count, maximum players, historical player trends, daily and weekly growth statistics, and server uptime monitoring. Stats are updated every 10 minutes.`,
    },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <Script
      id={`faq-structured-data-${server.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
    />
  );
}
