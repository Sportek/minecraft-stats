"use client";

import Image from "next/image";
import { useState } from "react";
import { getClientBackendUrl } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { LetterTile } from "@/components/ui/letter-tile";

interface ServerImageProps {
  imageUrl: string;
  name: string;
  className?: string;
}

const ServerImage = ({ imageUrl, name, className }: ServerImageProps) => {
  const backendUrl = getClientBackendUrl();
  const [src, setSrc] = useState(imageUrl ? `${backendUrl}${imageUrl}.webp` : "");

  if (!src) {
    return <LetterTile name={name} className={cn("h-12 w-12 rounded-md text-lg", className)} />;
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
        // First failure: try the PNG; second failure: fall back to the letter tile.
        setSrc((current) => (current !== png ? png : ""));
      }}
    />
  );
};

export default ServerImage;
