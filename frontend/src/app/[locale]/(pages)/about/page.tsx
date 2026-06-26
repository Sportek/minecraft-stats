import { Metadata } from "next";
import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/domain-server";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const { canonical, languages } = buildAlternates(locale, "/about");

  return {
    title: "About Us",
    description:
      "Learn about our mission to provide transparent, public, and free comparison of Minecraft servers based on objective data. Discover how we help players find and compare servers.",
    keywords: "about, minecraft stats, server comparison, transparency, minecraft server list, fair ranking",
    openGraph: {
      title: "About Us - Minecraft Stats",
      description:
        "Our platform provides transparent, public, and free comparison of Minecraft servers based on objective and accessible data.",
      type: "website",
      url: canonical,
    },
    alternates: {
      canonical,
      languages,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};

const About = async () => {
  const t = await getTranslations("StaticPages");
  const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">{t("about.eyebrow")}</div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("about.title")}</h1>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("about.aboutUs.title")}</h2>
        <p className="mb-4">{t("about.aboutUs.p1")}</p>
        <p className="mb-4">{t.rich("about.aboutUs.p2", { strong })}</p>
        <p className="mb-4">{t.rich("about.aboutUs.p3", { strong })}</p>
        <p className="mb-4">{t("about.aboutUs.p4")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("about.playersFirst.title")}</h2>
        <p className="mb-4">{t("about.playersFirst.p1")}</p>
        <p className="mb-2">{t("about.playersFirst.p2")}</p>
        <ul className="list-disc list-inside pl-4 mb-4">
          <li>{t("about.playersFirst.item1")}</li>
          <li>{t("about.playersFirst.item2")}</li>
          <li>{t("about.playersFirst.item3")}</li>
        </ul>
        <p className="mb-4">{t.rich("about.playersFirst.p3", { strong })}</p>
        <p className="mb-4">{t.rich("about.playersFirst.p4", { strong })}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("about.transparency.title")}</h2>
        <p className="mb-4">{t("about.transparency.p1")}</p>
        <p className="mb-4">{t("about.transparency.p2")}</p>
        <p className="mb-2">{t.rich("about.transparency.p3", { strong })}</p>
        <ul className="list-disc list-inside pl-4 mb-4">
          <li>{t.rich("about.transparency.item1", { strong })}</li>
          <li>{t.rich("about.transparency.item2", { strong })}</li>
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("about.evolving.title")}</h2>
        <p className="mb-4">{t("about.evolving.p1")}</p>
        <p className="mb-4">{t("about.evolving.p2")}</p>
        <p className="mb-4">{t("about.evolving.p3")}</p>
        <p className="mb-4">{t.rich("about.evolving.p4", { strong })}</p>
        <p className="mb-4">{t("about.evolving.p5")}</p>
      </section>
    </div>
  );
};

export default About;
