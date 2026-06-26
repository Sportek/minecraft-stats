import { Link } from "@/i18n/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getTranslations } from "next-intl/server";
import ExploreServersButton from "./explore-servers-button";

const HeroSection = async () => {
  const t = await getTranslations("Home");
  return (
    <section className="w-full pt-10 pb-6 md:pt-14">
      {/* Live monitoring pill — success dot with a soft ring */}
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-secondary-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-success ring-4 ring-success/20" />
        {t("hero.badge")}
      </div>

      <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-tight text-balance text-foreground sm:text-4xl md:text-5xl">
        {t.rich("hero.title", {
          accent: (chunks) => <span className="text-accent">{chunks}</span>,
        })}
      </h1>

      <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">{t("hero.subtitle")}</p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/account/add-server"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-xs transition-all hover:bg-accent/90 hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Icon icon="material-symbols:rocket-launch" className="h-4 w-4" />
          {t("hero.addServer")}
        </Link>
        <ExploreServersButton />
      </div>
    </section>
  );
};

export default HeroSection;
