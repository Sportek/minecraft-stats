import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import ExploreServersButton from "./explore-servers-button";

const HeroSection = () => {
  return (
    <section className="w-full pt-10 pb-6 md:pt-14">
      {/* Live monitoring pill — success dot with a soft ring */}
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-secondary-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-success ring-4 ring-success/20" />
        Live monitoring · every 10 minutes
      </div>

      <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-tight text-balance text-foreground sm:text-4xl md:text-5xl">
        Track Minecraft server popularity <span className="text-accent">in real time.</span>
      </h1>

      <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
        Real player counts, growth trends, and side-by-side comparisons — all backed by years of historical data.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/account/add-server"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-xs transition-all hover:bg-accent/90 hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Icon icon="material-symbols:rocket-launch" className="h-4 w-4" />
          Add Your Server
        </Link>
        <ExploreServersButton />
      </div>
    </section>
  );
};

export default HeroSection;
