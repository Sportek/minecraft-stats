import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslations } from "next-intl";
import { Server } from "@/types/server";

interface ServerFAQProps {
  server: Server;
  currentPlayers?: number;
  maxPlayers?: number;
}

/**
 * Visible FAQ accordion. Mirrors the questions/answers emitted by
 * `ServerFAQStructuredData` so the on-page content matches the SEO JSON-LD.
 * Uses native <details>/<summary> styled with design tokens.
 */
const ServerFAQ = ({ server, currentPlayers = 0, maxPlayers = 0 }: ServerFAQProps) => {
  const t = useTranslations("Servers");
  const joinAddress = `${server.address}${server.port == 25565 ? "" : `:${server.port}`}`;

  const faqItems = [
    {
      question: t("faq.join.question", { name: server.name }),
      answer: t("faq.join.answer", { name: server.name, address: joinAddress }),
    },
    {
      question: t("faq.playersOnline.question", { name: server.name }),
      answer: t("faq.playersOnline.answer", { name: server.name, count: currentPlayers, maxPlayers }),
    },
    {
      question: t("faq.version.question", { name: server.name }),
      answer: server.version
        ? t("faq.version.answerKnown", { name: server.name, version: server.version })
        : t("faq.version.answerUnknown", { name: server.name }),
    },
    {
      question: t("faq.online.question", { name: server.name }),
      answer: t("faq.online.answer", { name: server.name, active: String(currentPlayers > 0) }),
    },
    {
      question: t("faq.statistics.question", { name: server.name }),
      answer: t("faq.statistics.answer", { name: server.name }),
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center gap-2 border-b border-border px-6 py-5">
        <Icon icon="material-symbols:help-outline" className="h-5 w-5 shrink-0 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">{t("faq.heading")}</h2>
      </div>

      <div className="divide-y divide-border">
        {faqItems.map((faq) => (
          <details key={faq.question} className="group px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{faq.question}</span>
              <span
                aria-hidden="true"
                className="shrink-0 text-lg font-semibold leading-none text-accent transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default ServerFAQ;
