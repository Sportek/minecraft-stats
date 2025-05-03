import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Discover our partners who offer valuable tools and services for your Minecraft servers. From server management to custom plugins, our partners provide essential resources to enhance your server's performance and user experience. Explore how these partnerships can benefit your Minecraft community.",
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 