"use client";

import Image from "next/image";
import { useState } from "react";
import { getClientBackendUrl } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface ServerImageProps {
  imageUrl: string;
  name: string;
  className?: string;
}

// Teinte stable dérivée du nom : sert de fond dégradé pour la tuile-initiale
// affichée quand le serveur n'a pas (ou plus) de favicon.
const hueFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

const LetterTile = ({ name, className }: { name: string; className?: string }) => {
  const hue = hueFromName(name);
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-md text-lg font-extrabold text-white",
        className
      )}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 62% 46%), hsl(${hue + 26} 70% 26%))` }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
};

const ServerImage = ({ imageUrl, name, className }: ServerImageProps) => {
  const backendUrl = getClientBackendUrl();
  const [src, setSrc] = useState(imageUrl ? `${backendUrl}${imageUrl}.webp` : "");

  if (!src) {
    return <LetterTile name={name} className={className} />;
  }

  return (
    <Image
      src={src}
      alt={name}
      width={48}
      height={48}
      quality={75}
      priority
      className={cn("h-12 w-12 rounded-md object-cover", className)}
      onError={() => {
        const png = `${backendUrl}${imageUrl}.png`;
        // 1er échec : on tente le PNG ; 2e échec : on bascule sur la tuile-initiale.
        setSrc((current) => (current !== png ? png : ""));
      }}
    />
  );
};

export default ServerImage;
