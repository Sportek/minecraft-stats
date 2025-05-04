"use client";

import { Card } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import Link from "next/link";
import React from "react";

const partnersData = [
  {
    name: "TOP MINECRAFT CLICK",
    url: "https://topminecraft.click/fr",
    description: "The best Minecraft server list to promote your server and get more players.",
    icon: "game-icons:abstract-050",
  },
  {
    name: "SERVEUR MINECRAFT VOTE",
    url: "https://serveur-minecraft-vote.fr/",
    description: "A platform dedicated to Minecraft server voting, helping you increase your server's visibility.",
    icon: "game-icons:abstract-050",
  },
  {
    name: "MINECRAFT INVENTORY BUILDER",
    url: "https://minecraft-inventory-builder.com/",
    description: "Create and customize Minecraft inventories with an intuitive interface.",
    icon: "game-icons:abstract-050",
  },
];

const Partners = () => {
  return (
    <main className="flex-1 space-y-4 py-4">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Our Partners</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Discover trusted services that can help improve your Minecraft server experience.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partnersData.map((partner) => (
            <Link 
              href={partner.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              key={partner.url}
              className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Card className="h-full p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-stats-blue-600/10 dark:bg-stats-blue-400/10">
                    <Icon 
                      icon={partner.icon} 
                      className="w-6 h-6 text-stats-blue-600 dark:text-stats-blue-400" 
                    />
                  </div>
                  <h2 className="font-semibold">{partner.name}</h2>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
                  {partner.description}
                </p>
                <div className="flex items-center text-stats-blue-600 dark:text-stats-blue-400 text-sm font-medium">
                  Visit Partner
                  <Icon icon="lucide:arrow-right" className="w-4 h-4 ml-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Partners;
