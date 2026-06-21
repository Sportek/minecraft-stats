"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveAssetUrl } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { LetterTile } from "@/components/ui/letter-tile";
import { Skeleton } from "@/components/ui/skeleton";

interface ServerImageProps {
  imageUrl: string;
  name: string;
  className?: string;
}

const ServerImage = ({ imageUrl, name, className }: ServerImageProps) => {
  const [src, setSrc] = useState(imageUrl ? resolveAssetUrl(`${imageUrl}.webp`) : "");
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return <LetterTile name={name} className={cn("h-12 w-12 rounded-md text-lg", className)} />;
  }

  return (
    <div className={cn("relative h-12 w-12 overflow-hidden rounded-md", className)}>
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
      <Image
        src={src}
        alt={name}
        width={48}
        height={48}
        quality={75}
        priority
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onError={() => {
          const png = resolveAssetUrl(`${imageUrl}.png`);
          // First failure: try the PNG; second failure: fall back to the letter tile.
          setSrc((current) => (current !== png ? png : ""));
        }}
      />
    </div>
  );
};

export default ServerImage;
