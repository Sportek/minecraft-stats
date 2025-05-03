import { Button } from "../ui/button";

const HeroSection = () => {
  return (
    <section className="w-full py-16 md:py-24 flex flex-col items-center md:items-start text-center md:text-left">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-3xl">
        Track Minecraft server popularity in real time.
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl">
        Get real-time player counts, analyze trends, and compare servers instantly. Join the stats revolution.
      </p>
      <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
        <Button size="lg">🚀 Add Your Server</Button>
        <Button variant="outline" size="lg">
          🔍 Explore Servers
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
