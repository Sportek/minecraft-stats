"use client";

import { Button } from "../ui/button";

const ExploreServersButton = () => {
  const scrollToServerCards = () => {
    const target = document.getElementById("server-cards-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Button variant="outline" size="lg" onClick={scrollToServerCards}>
      🔍 Explore Servers
    </Button>
  );
};

export default ExploreServersButton;
