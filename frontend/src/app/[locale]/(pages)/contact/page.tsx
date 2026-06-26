import { Card } from "@/components/ui/card";
import { buildAlternates } from "@/lib/domain-server";
import { Icon } from "@iconify/react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const { canonical, languages } = buildAlternates(locale, "/contact");

  return {
    title: "Contact",
    description:
      "Get in touch with the Minecraft Stats team. Reach us through Discord, GitHub, or email for questions, feedback, server removal requests, and support.",
    keywords: "contact, support, minecraft stats, discord, github, feedback",
    openGraph: {
      title: "Contact - Minecraft Stats",
      description:
        "Reach the Minecraft Stats team through Discord, GitHub, or email for questions, feedback, and support.",
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

// Real contact channels, since there is no contact-form backend.
const channels = [
  {
    key: "discord",
    href: "https://discord.gg/Ru9fecKwPn",
    icon: "mdi:discord",
    external: true,
  },
  {
    key: "github",
    href: "https://github.com/Sportek/minecraft-stats",
    icon: "mdi:github",
    external: true,
  },
  {
    key: "email",
    href: "mailto:contact@minecraft-stats.com",
    icon: "mdi:email-outline",
    external: false,
  },
];

const Contact = async () => {
  const t = await getTranslations("StaticPages");

  return (
    <main className="flex-1 space-y-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{t("contact.eyebrow")}</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("contact.title")}</h1>
          <p className="text-muted-foreground">{t("contact.subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Link
              href={channel.href}
              key={channel.key}
              target={channel.external ? "_blank" : undefined}
              rel={channel.external ? "noopener noreferrer" : undefined}
              className="group rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="flex h-full flex-col gap-4 p-6 transition-all hover:border-accent/50 hover:shadow-md">
                <div className="flex items-center gap-2.5">
                  <Icon icon={channel.icon} className="h-6 w-6 shrink-0 text-muted-foreground" />
                  <h2 className="font-semibold tracking-tight text-foreground">
                    {t(`contact.channels.${channel.key}.name`)}
                  </h2>
                </div>
                <p className="flex-1 text-sm text-muted-foreground">
                  {t(`contact.channels.${channel.key}.description`)}
                </p>
                <div className="flex items-center text-sm font-medium text-accent">
                  {t(`contact.channels.${channel.key}.cta`)}
                  <Icon
                    icon="lucide:arrow-right"
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Contact;
