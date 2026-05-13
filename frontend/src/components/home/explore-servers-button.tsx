"use client";

import { Icon } from "@iconify/react/dist/iconify.js";

const ExploreServersButton = () => {
  const scrollToServerCards = () => {
    const target = document.getElementById("server-cards-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      onClick={scrollToServerCards}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background/60 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition-all hover:bg-background hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Icon icon="material-symbols:search" className="h-4 w-4" />
      Explore Servers
    </button>
  );
};

export default ExploreServersButton;
