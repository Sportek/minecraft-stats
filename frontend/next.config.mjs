/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "cdn.discordapp.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "localhost" },
      { hostname: "api.minecraftstats.fr" },
    ],
  },
};

export default nextConfig;
