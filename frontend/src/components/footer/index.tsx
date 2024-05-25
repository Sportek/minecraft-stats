import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import Image from "next/image";
import { Button } from "../ui/button";
const Footer = () => {
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-row items-center justify-start w-full gap-2">
            <Image src={MinecraftStatsLogo} alt="Minecraft Stats Logo" width={32} height={32} />
            <div className="text-2xl font-bold">Minecraft Stats</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm">
              Minecraft Stats est un service gratuit qui permet de répertorier les statistiques de connections des
              différents serveurs Minecraft existants. Vous pouvez ajouter facilement un serveur Minecraft et obtenir
              des statistiques de connections en temps réel.
            </div>
            <Button variant="outline" className="w-full">
              Ajouter un serveur
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between w-full">
        <div>Icons</div>
        <div className="text-sm">Copyright © 2024 Minecraft Stats. All Rights Reserved.</div>
      </div>
    </div>
  );
};

export default Footer;
