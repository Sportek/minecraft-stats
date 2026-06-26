import { getServer } from "@/http/server";
import { getLastStat } from "@/utils/stats";
import { Metadata } from "next";
import { buildAlternates, getDomainConfig, getOpenGraphLocales } from "@/lib/domain-server";

// ISR — la metadata (OG, title, description) est rebuild toutes les 10 minutes
// au lieu d'être re-fetched à chaque requête (P.4.3 ; remplace force-dynamic).
export const revalidate = 600;

export const generateMetadata = async (props: {
  params: Promise<{ locale: string; serverId: string; serverName: string[] }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const { backendUrl } = await getDomainConfig();
  const assetsBase = process.env.NEXT_PUBLIC_ASSETS_URL || backendUrl;
  try {
    const server = await getServer(Number(params.serverId));
    const lastStat = getLastStat(server.stats);
    const playerCount = lastStat.playerCount ?? 0;
    const categories = server.categories.map((c) => c.name).join(", ");
    const languages = server.server.languages.map((l) => l.name).join(", ");
    const imageUrl = `${assetsBase}${server.server.imageUrl}.webp`;

    // Create a clean slug for the canonical URL
    const slug = server.server.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const title = `${server.server.name} - Minecraft Server Stats & Analytics`;
    const description = `Track ${server.server.name}, a ${categories} Minecraft server with ${playerCount} players online. Real-time statistics, player count graphs, and growth trends. Languages: ${languages}.`;

    const { canonical, languages: alternateLanguages } = buildAlternates(
      params.locale,
      `/servers/${server.server.id}/${slug}`,
    );
    const og = getOpenGraphLocales(params.locale);

    return {
      title,
      description,
      keywords: [
        "minecraft server",
        server.server.name,
        ...server.categories.map((c) => c.name),
        "player count",
        "server stats",
        "minecraft statistics",
        "minecraft analytics",
        "server monitoring",
      ].join(", "),
      authors: [{ name: "Minecraft Stats" }],
      openGraph: {
        title,
        description,
        type: "website",
        url: canonical,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${server.server.name} Minecraft Server Statistics`,
          },
        ],
        siteName: "Minecraft Stats",
        locale: og.locale,
        alternateLocale: og.alternateLocale,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
        creator: "@MinecraftStats",
      },
      alternates: {
        canonical,
        languages: alternateLanguages,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error("Erreur", error);
    return {
      title: "Server Not Found - Minecraft Server Stats",
      description:
        "The requested Minecraft server could not be found. Browse other Minecraft servers and their statistics.",
      openGraph: {
        title: "Server Not Found - Minecraft Server Stats",
        description:
          "The requested Minecraft server could not be found. Browse other Minecraft servers and their statistics.",
        type: "website",
        siteName: "Minecraft Stats",
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
