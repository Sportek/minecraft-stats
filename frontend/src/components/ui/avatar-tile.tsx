"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LetterTile } from "./letter-tile";

interface AvatarTileProps {
  name: string;
  src?: string | null;
  className?: string;
}

/**
 * Square avatar that shows `src` when available and falls back to the shared
 * name-hashed LetterTile when there is no image or it fails to load.
 */
export const AvatarTile = ({ name, src, className }: AvatarTileProps) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <LetterTile name={name} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" onError={() => setFailed(true)} className={cn("object-cover", className)} />
  );
};
