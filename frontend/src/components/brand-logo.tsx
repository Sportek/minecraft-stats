import MinecraftStatsLogo from "@/images/minecraft-stats/logo.svg";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  size?: number;
  onClick?: () => void;
}

/** Minecraft Stats brand mark (ascending-bars logo + wordmark), reused in the header, footer and mobile drawer. */
const BrandLogo = ({ className, size = 28, onClick }: BrandLogoProps) => (
  <Link href="/" onClick={onClick} className={cn("flex items-center gap-2", className)}>
    <Image src={MinecraftStatsLogo} alt="" width={size} height={size} priority />
    <span className="text-base font-bold tracking-tight text-foreground">Minecraft Stats</span>
  </Link>
);

export default BrandLogo;
