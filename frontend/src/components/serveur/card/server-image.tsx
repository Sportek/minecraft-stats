import Image from "next/image";
import NotFound from "../not-found";

interface ServerImageProps {
  imageUrl: string;
  name: string;
}

const ServerImage = ({ imageUrl, name }: ServerImageProps) => {
  const imageUrlPng = `${process.env.NEXT_PUBLIC_BACKEND_URL}${imageUrl}.png`;
  const imageUrlWebP = `${process.env.NEXT_PUBLIC_BACKEND_URL}${imageUrl}.webp`;

  if (!imageUrl) {
    return <NotFound className="text-stats-blue-950 dark:text-stats-blue-50 w-12 h-12" />;
  }

  return (
    <Image
      src={imageUrlWebP}
      alt={name}
      width={48}
      height={48}
      quality={75}
      priority={true}
      className="object-cover rounded-md"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = imageUrlPng;
      }}
    />
  );
};

export default ServerImage; 