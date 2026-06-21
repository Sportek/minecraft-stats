import { Card } from "@/components/ui/card";
import { getDomainConfig } from "@/lib/domain-server";
import { Icon } from "@iconify/react";
import { Metadata } from "next";
import Link from "next/link";

export const generateMetadata = async (): Promise<Metadata> => {
  const { baseUrl } = await getDomainConfig();

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
      url: `${baseUrl}/contact`,
    },
    alternates: {
      canonical: `${baseUrl}/contact`,
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
    name: "Discord",
    description: "Join our community for the fastest response, support, and feature discussions.",
    href: "https://discord.gg/Ru9fecKwPn",
    icon: "mdi:discord",
    cta: "Open Discord",
    external: true,
  },
  {
    name: "GitHub",
    description: "Report a bug, request a feature, or contribute to the open-source project.",
    href: "https://github.com/Sportek/minecraft-stats",
    icon: "mdi:github",
    cta: "Open GitHub",
    external: true,
  },
  {
    name: "Email",
    description: "For private inquiries, GDPR requests, or server removal requests.",
    href: "mailto:contact@minecraft-stats.com",
    icon: "mdi:email-outline",
    cta: "Send an email",
    external: false,
  },
];

const Contact = () => {
  return (
    <main className="flex-1 space-y-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Contact</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Get in Touch</h1>
          <p className="text-muted-foreground">
            Questions, feedback, or a server removal request? Reach us through any of the channels below — Discord is
            usually the quickest.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Link
              href={channel.href}
              key={channel.name}
              target={channel.external ? "_blank" : undefined}
              rel={channel.external ? "noopener noreferrer" : undefined}
              className="group rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="flex h-full flex-col gap-4 p-6 transition-all hover:border-accent/50 hover:shadow-md">
                <div className="flex items-center gap-2.5">
                  <Icon icon={channel.icon} className="h-6 w-6 shrink-0 text-muted-foreground" />
                  <h2 className="font-semibold tracking-tight text-foreground">{channel.name}</h2>
                </div>
                <p className="flex-1 text-sm text-muted-foreground">{channel.description}</p>
                <div className="flex items-center text-sm font-medium text-accent">
                  {channel.cta}
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
