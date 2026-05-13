import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import ExploreServersButton from "./explore-servers-button";

const HeroSection = () => {
  return (
    <section className="relative w-full overflow-hidden py-16 md:py-24">
      {/* Décorations de fond — gradient blurs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-stats-blue-400/15 blur-3xl" />
      </div>

      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        {/* Eyebrow live indicator */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live monitoring · every 10 minutes
        </div>

        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl">
          Track Minecraft server popularity{" "}
          <span className="bg-gradient-to-r from-stats-blue-600 to-stats-blue-400 bg-clip-text text-transparent">
            in real time.
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Real player counts, growth trends, and side-by-side comparisons —
          all backed by years of historical data.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row flex-wrap justify-center md:justify-start gap-3">
          <Link
            href="/account/add-server"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Icon icon="material-symbols:rocket-launch" className="h-4 w-4" />
            Add Your Server
          </Link>
          <ExploreServersButton />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
