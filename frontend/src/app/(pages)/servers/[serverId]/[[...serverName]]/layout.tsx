import { getServer } from "@/http/server";
import { Metadata } from "next";

export const generateMetadata = async ({params}: {params: {serverId: string, serverName: string[]}}): Promise<Metadata> => {
  try {
    console.log('Hello fetch server ici')
    const server = await getServer(Number(params.serverId));
    return Promise.resolve({
      title: server.server.name,
    description: `${server.server.name} is a ${server.categories.map((c) => c.name).join(", ")} server with currently ${
      server.stat?.playerCount ?? 0
    } online players.`,
    openGraph: {
      images: [{ url: server.server.imageUrl }],
    },
  });
  } catch (error) {
    return Promise.resolve({
      title: "Server not found",
    });
  }
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;