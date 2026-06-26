"use client";

import { Card } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
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
    <main className="flex-1 space-y-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Partners</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Our Partners</h1>
          <p className="text-muted-foreground">
            Discover trusted services that can help improve your Minecraft server experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {partnersData.map((partner) => (
            <Link
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              key={partner.url}
              className="group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            >
              <Card className="flex h-full flex-col gap-4 p-6 transition-all hover:border-accent/50 hover:shadow-md">
                <div className="flex items-center gap-2.5">
                  <Icon icon={partner.icon} className="h-6 w-6 shrink-0 text-muted-foreground" />
                  <h2 className="font-semibold tracking-tight text-foreground">{partner.name}</h2>
                </div>
                <p className="flex-1 text-sm text-muted-foreground">{partner.description}</p>
                <div className="flex items-center text-sm font-medium text-accent">
                  Visit Partner
                  <Icon icon="lucide:arrow-right" className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
