import { getServer } from "@/http/server";
import { getLastStat } from "@/utils/stats";
import { Metadata } from "next";

export const generateMetadata = async (props: {params: Promise<{serverId: string, serverName: string[]}>}): Promise<Metadata> => {
  const params = await props.params;
  try {
    const server = await getServer(Number(params.serverId));
    return Promise.resolve({
      title: server.server.name,
    description: `${server.server.name} is a ${server.categories.map((c) => c.name).join(", ")} server with currently ${
      getLastStat(server.stats).playerCount ?? 0
    } online players and it is available in ${server.server.languages.map((l) => l.name).join(", ")}.`,
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