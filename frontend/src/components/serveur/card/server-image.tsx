import Image from "next/image";
import { useState } from "react";
import NotFound from "../not-found";

interface ServerImageProps {
  imageUrl: string;
  name: string;
}

const ServerImage = ({ imageUrl, name }: ServerImageProps) => {
  const imageUrlPng = `${process.env.NEXT_PUBLIC_BACKEND_URL}${imageUrl}.png`;
  const imageUrlWebP = `${process.env.NEXT_PUBLIC_BACKEND_URL}${imageUrl}.webp`;
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrlWebP);

  if (!imageUrl) {
    return <NotFound className="text-stats-blue-950 dark:text-stats-blue-50 w-12 h-12" />;
  }

  return (
    <Image
      src={currentImageUrl}
      alt={name}
      width={48}
      height={48}
      quality={75}
      priority={false}
      loading="lazy"
      sizes="48px"
      onError={() => setCurrentImageUrl(imageUrlPng)}
      className="object-cover rounded-md"
      unoptimized={true}
    />
  );
};

export default ServerImage; 