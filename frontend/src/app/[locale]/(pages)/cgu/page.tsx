import { Metadata } from "next";
import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/domain-server";
import { Link } from "@/i18n/navigation";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const { canonical, languages } = buildAlternates(locale, "/cgu");
  const t = await getTranslations({ locale, namespace: "StaticPages" });

  return {
    title: t("cgu.meta.title"),
    description: t("cgu.meta.description"),
    keywords: t("cgu.meta.keywords"),
    openGraph: {
      title: t("cgu.meta.ogTitle"),
      description: t("cgu.meta.ogDescription"),
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

const CGU = async () => {
  const t = await getTranslations("StaticPages");
  const mail = (chunks: ReactNode) => (
    <a href="mailto:legal@minecraft-stats.com" className="font-medium text-accent hover:underline">
      {chunks}
    </a>
  );
  const homeLink = (chunks: ReactNode) => (
    <Link href="/" className="font-medium text-accent hover:underline">
      {chunks}
    </Link>
  );
  const privacyLink = (chunks: ReactNode) => (
    <Link href="/privacy" className="font-medium text-accent hover:underline">
      {chunks}
    </Link>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">{t("cgu.eyebrow")}</div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("cgu.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("cgu.lastUpdated")}</p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.legalInfo.title")}</h2>
        <p>{t.rich("cgu.legalInfo.body", { mail })}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.purpose.title")}</h2>
        <p>{t.rich("cgu.purpose.body", { link: homeLink })}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.registration.title")}</h2>
        <p>{t("cgu.registration.intro")}</p>
        <ul className="list-disc list-inside pl-4">
          <li>{t("cgu.registration.item1")}</li>
          <li>{t("cgu.registration.item2")}</li>
        </ul>
        <p>{t("cgu.registration.outro")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.dataProcessing.title")}</h2>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("cgu.dataProcessing.typesTitle")}</h3>
        <p>{t("cgu.dataProcessing.typesBody")}</p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("cgu.dataProcessing.useTitle")}</h3>
        <p>{t("cgu.dataProcessing.useIntro")}</p>
        <ul className="list-disc list-inside pl-4">
          <li>{t("cgu.dataProcessing.useItem1")}</li>
          <li>{t("cgu.dataProcessing.useItem2")}</li>
          <li>{t("cgu.dataProcessing.useItem3")}</li>
        </ul>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("cgu.dataProcessing.cookiesTitle")}</h3>
        <p>{t.rich("cgu.dataProcessing.cookiesBody", { link: privacyLink })}</p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("cgu.dataProcessing.storageTitle")}</h3>
        <p>{t("cgu.dataProcessing.storageBody")}</p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("cgu.dataProcessing.rightsTitle")}</h3>
        <p>{t("cgu.dataProcessing.rightsIntro")}</p>
        <ul className="list-disc list-inside pl-4">
          <li>{t("cgu.dataProcessing.rightsItem1")}</li>
          <li>{t("cgu.dataProcessing.rightsItem2")}</li>
          <li>{t("cgu.dataProcessing.rightsItem3")}</li>
          <li>{t("cgu.dataProcessing.rightsItem4")}</li>
          <li>{t("cgu.dataProcessing.rightsItem5")}</li>
          <li>{t("cgu.dataProcessing.rightsItem6")}</li>
        </ul>
        <p>{t.rich("cgu.dataProcessing.rightsOutro", { mail })}</p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("cgu.dataProcessing.dpoTitle")}</h3>
        <p>{t("cgu.dataProcessing.dpoBody")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.intellectualProperty.title")}</h2>
        <p>{t("cgu.intellectualProperty.body")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.obligations.title")}</h2>
        <p>{t("cgu.obligations.p1")}</p>
        <p>{t.rich("cgu.obligations.p2", { mail })}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.liability.title")}</h2>
        <p>{t("cgu.liability.body")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.jurisdiction.title")}</h2>
        <p>{t("cgu.jurisdiction.body")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.amendments.title")}</h2>
        <p>{t("cgu.amendments.body")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.contact.title")}</h2>
        <p>{t.rich("cgu.contact.body", { mail })}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("cgu.privacy.title")}</h2>
        <p>{t.rich("cgu.privacy.body", { link: privacyLink })}</p>
      </section>
    </div>
  );
};

export default CGU;
