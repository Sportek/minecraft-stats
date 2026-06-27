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
  const { canonical, languages } = buildAlternates(locale, "/privacy");
  const t = await getTranslations({ locale, namespace: "StaticPages" });

  return {
    title: t("privacy.meta.title"),
    description: t("privacy.meta.description"),
    keywords: t("privacy.meta.keywords"),
    openGraph: {
      title: t("privacy.meta.ogTitle"),
      description: t("privacy.meta.ogDescription"),
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

const Privacy = async () => {
  const t = await getTranslations("StaticPages");
  const mail = (chunks: ReactNode) => (
    <a href="mailto:legal@minecraft-stats.com" className="font-medium text-accent hover:underline">
      {chunks}
    </a>
  );
  const extLink = (href: string) => {
    const ExtLink = (chunks: ReactNode) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
        {chunks}
      </a>
    );
    return ExtLink;
  };
  const termsLink = (chunks: ReactNode) => (
    <Link href="/cgu" className="font-medium text-accent hover:underline">
      {chunks}
    </Link>
  );
  const contactLink = (chunks: ReactNode) => (
    <Link href="/contact" className="font-medium text-accent hover:underline">
      {chunks}
    </Link>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">{t("privacy.eyebrow")}</div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("privacy.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("privacy.overview.title")}</h2>
        <p>{t.rich("privacy.overview.body", { link: termsLink })}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("privacy.dataCollect.title")}</h2>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.dataCollect.accountTitle")}</h3>
        <p>{t("privacy.dataCollect.accountBody")}</p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.dataCollect.contentTitle")}</h3>
        <p>{t("privacy.dataCollect.contentBody")}</p>
        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.dataCollect.usageTitle")}</h3>
        <p>{t("privacy.dataCollect.usageBody")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("privacy.howWeUse.title")}</h2>
        <ul className="list-disc list-inside pl-4">
          <li>{t("privacy.howWeUse.item1")}</li>
          <li>{t("privacy.howWeUse.item2")}</li>
          <li>{t("privacy.howWeUse.item3")}</li>
          <li>{t("privacy.howWeUse.item4")}</li>
          <li>{t("privacy.howWeUse.item5")}</li>
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("privacy.cookies.title")}</h2>
        <p>{t("privacy.cookies.body")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("privacy.firstParty.title")}</h2>
        <p>{t("privacy.firstParty.intro")}</p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.firstParty.anonymousTitle")}</h3>
        <p>{t("privacy.firstParty.anonymousBody")}</p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.firstParty.detailedTitle")}</h3>
        <p>{t("privacy.firstParty.detailedBody")}</p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.firstParty.whatTitle")}</h3>
        <ul className="list-disc list-inside pl-4">
          <li>{t("privacy.firstParty.whatItem1")}</li>
          <li>{t("privacy.firstParty.whatItem2")}</li>
          <li>{t("privacy.firstParty.whatItem3")}</li>
          <li>{t("privacy.firstParty.whatItem4")}</li>
        </ul>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.firstParty.consentTitle")}</h3>
        <p>{t("privacy.firstParty.consentBody")}</p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.firstParty.linkTitle")}</h3>
        <p>{t("privacy.firstParty.linkBody")}</p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.firstParty.retentionTitle")}</h3>
        <p>{t("privacy.firstParty.retentionBody")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("privacy.thirdParty.title")}</h2>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.thirdParty.umamiTitle")}</h3>
        <p>{t("privacy.thirdParty.umamiBody")}</p>
        <p className="mt-2">{t.rich("privacy.thirdParty.umamiMore", { link: extLink("https://umami.is/privacy") })}</p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.thirdParty.gtmTitle")}</h3>
        <p>{t("privacy.thirdParty.gtmBody")}</p>
        <p className="mt-2">
          {t.rich("privacy.thirdParty.gtmMore", { link: extLink("https://policies.google.com/privacy") })}
        </p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.thirdParty.clarityTitle")}</h3>
        <p>{t("privacy.thirdParty.clarityBody")}</p>
        <p className="mt-2">
          {t.rich("privacy.thirdParty.clarityMore", {
            link: extLink("https://privacy.microsoft.com/privacystatement"),
          })}
        </p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.thirdParty.adsenseTitle")}</h3>
        <p>{t("privacy.thirdParty.adsenseBody")}</p>
        <p className="mt-2">
          {t.rich("privacy.thirdParty.adsenseMore", {
            link1: extLink("https://adssettings.google.com/"),
            link2: extLink("https://policies.google.com/technologies/ads"),
          })}
        </p>

        <h3 className="mb-1 mt-4 text-base font-semibold text-foreground">{t("privacy.thirdParty.authTitle")}</h3>
        <p>{t("privacy.thirdParty.authBody")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("privacy.storage.title")}</h2>
        <p>{t("privacy.storage.body")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("privacy.retention.title")}</h2>
        <p>{t("privacy.retention.body")}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("privacy.rights.title")}</h2>
        <p>{t("privacy.rights.intro")}</p>
        <ul className="list-disc list-inside pl-4">
          <li>{t("privacy.rights.item1")}</li>
          <li>{t("privacy.rights.item2")}</li>
          <li>{t("privacy.rights.item3")}</li>
          <li>{t("privacy.rights.item4")}</li>
          <li>{t("privacy.rights.item5")}</li>
          <li>{t("privacy.rights.item6")}</li>
        </ul>
        <p>{t.rich("privacy.rights.outro", { mail })}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{t("privacy.contact.title")}</h2>
        <p>{t.rich("privacy.contact.body", { mail, link: contactLink })}</p>
      </section>
    </div>
  );
};

export default Privacy;
