/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "cdn.discordapp.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "localhost" },
      { hostname: "127.0.0.1" },
      { hostname: "api.minecraft-stats.fr" },
      { hostname: "*.tenor.com" },
    ],
    formats: ["image/webp"],
    minimumCacheTTL: 2678400,
    deviceSizes: [48, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200],
    imageSizes: [48, 96, 128, 256, 384],
  },
};

export default nextConfig;
