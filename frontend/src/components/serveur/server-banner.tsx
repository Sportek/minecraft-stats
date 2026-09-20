import Image from "next/image";
import { resolveAssetUrl } from "@/lib/domain";
import { BANNER_HEIGHT, BANNER_WIDTH } from "@/lib/server-customization";

interface ServerBannerProps {
  url: string;
  alt: string;
  className?: string;
}

/**
 * Bannière 468x60 d'un serveur (image fixe ou animée). `unoptimized` : l'API la
 * sert déjà en WebP à la bonne taille, et l'optimiseur de Next casserait
 * l'animation d'un WebP animé.
 */
const ServerBanner = ({ url, alt, className }: ServerBannerProps) => (
  <Image
    src={resolveAssetUrl(url)}
    alt={alt}
    width={BANNER_WIDTH}
    height={BANNER_HEIGHT}
    unoptimized
    loading="lazy"
    className={className}
  />
);

export default ServerBanner;
