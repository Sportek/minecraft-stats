import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";


export const metadata: Metadata = {
  title: "Partners",
  description:
    "Discover our partners who offer valuable tools and services for your Minecraft servers. From server management to custom plugins, our partners provide essential resources to enhance your server's performance and user experience. Explore how these partnerships can benefit your Minecraft community.",
};

const partnersData = [
  { name: "GROUPEZ", url: "https://groupez.dev/" },
  { name: "SERVEUR MINECRAFT VOTE", url: "https://serveur-minecraft-vote.fr/" },
  { name: "MINECRAFT INVENTORY BUILDER", url: "https://minecraft-inventory-builder.com/" },
  { name: "TOP MINECRAFT CLICK", url: "https://topminecraft.click/fr" },
];

const Partners = () => {
  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h1 className="text-3xl font-bold text-center mb-4">Partners</h1>
        <div className="flex flex-col gap-4">
          {partnersData.map((partner) => (
          <Link href={partner.url} target="_blank" rel="noopener noreferrer" key={partner.url}>
          <Button className="w-full">
            {partner.name}
          </Button>
          </Link>
        ))}
        </div>
    </div>
  );
};

export default Partners;
