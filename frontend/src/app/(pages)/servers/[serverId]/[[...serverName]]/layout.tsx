import { getServer } from "@/http/server";
import { getLastStat } from "@/utils/stats";
import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://minecraft-stats.com";
export const generateMetadata = async (props: {params: Promise<{serverId: string, serverName: string[]}>}): Promise<Metadata> => {
  const params = await props.params;
  try {
    const server = await getServer(Number(params.serverId));
    const lastStat = getLastStat(server.stats);
    const playerCount = lastStat.playerCount ?? 0;
    const categories = server.categories.map((c) => c.name).join(", ");
    const languages = server.server.languages.map((l) => l.name).join(", ");
    const imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${server.server.imageUrl}.webp`;

    return Promise.resolve({
      title: `${server.server.name} - Minecraft Server Stats`,
      description: `${server.server.name} is a ${categories} Minecraft server with ${playerCount} online players. Available in ${languages}. Track player count, growth, and server statistics.`,
      keywords: [
        "minecraft server",
        server.server.name,
        ...server.categories.map(c => c.name),
        "player count",
        "server stats",
        "minecraft statistics"
      ].join(", "),
      openGraph: {
        title: `${server.server.name} - Minecraft Server Stats`,
        description: `${server.server.name} is a ${categories} Minecraft server with ${playerCount} online players. Available in ${languages}.`,
        type: "website",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${server.server.name} Minecraft Server`
          }
        ],
        siteName: "Minecraft Server Stats"
      },
      twitter: {
        card: "summary_large_image",
        title: `${server.server.name} - Minecraft Server Stats`,
        description: `${server.server.name} is a ${categories} Minecraft server with ${playerCount} online players.`,
        images: [imageUrl],
      },
      alternates: {
        canonical: `${baseUrl}/servers/${server.server.id}/${server.server.name}`
      }
    });
  } catch (error) {
    return Promise.resolve({
      title: "Server Not Found - Minecraft Server Stats",
      description: "The requested Minecraft server could not be found. Browse other Minecraft servers and their statistics.",
      openGraph: {
        title: "Server Not Found - Minecraft Server Stats",
        description: "The requested Minecraft server could not be found. Browse other Minecraft servers and their statistics.",
        type: "website",
        siteName: "Minecraft Server Stats"
      }
    });
  }
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;