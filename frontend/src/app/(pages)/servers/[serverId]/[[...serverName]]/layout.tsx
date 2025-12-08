import { getServer } from "@/http/server";
import { getLastStat } from "@/utils/stats";
import { Metadata } from "next";
export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://minecraft-stats.fr";
export const generateMetadata = async (props: {
  params: Promise<{ serverId: string; serverName: string[] }>;
}): Promise<Metadata> => {
  const params = await props.params;
  try {
    const server = await getServer(Number(params.serverId));
    const lastStat = getLastStat(server.stats);
    const playerCount = lastStat.playerCount ?? 0;
    const categories = server.categories.map((c) => c.name).join(", ");
    const languages = server.server.languages.map((l) => l.name).join(", ");
    const imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${server.server.imageUrl}.webp`;

    // Create a clean slug for the canonical URL
    const slug = server.server.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const title = `${server.server.name} - Minecraft Server Stats & Analytics`;
    const description = `Track ${server.server.name}, a ${categories} Minecraft server with ${playerCount} players online. Real-time statistics, player count graphs, and growth trends. Languages: ${languages}.`;

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
        url: `${baseUrl}/servers/${server.server.id}/${slug}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${server.server.name} Minecraft Server Statistics`,
          },
        ],
        siteName: "Minecraft Stats",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
        creator: "@MinecraftStats",
      },
      alternates: {
        canonical: `${baseUrl}/servers/${server.server.id}/${slug}`,
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
