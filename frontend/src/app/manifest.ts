import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Minecraft Stats - Server Analytics",
    short_name: "Minecraft Stats",
    description: "Track and analyze your Minecraft server performance with real-time statistics",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563EB",
    icons: [
      {
        src: "/images/minecraft-stats/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["games", "utilities"],
    orientation: "portrait-primary",
    scope: "/",
    lang: "en",
  };
}
