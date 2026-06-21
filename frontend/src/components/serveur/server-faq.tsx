import { Icon } from "@iconify/react/dist/iconify.js";
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
  const faqItems = [
    {
      question: `How do I join the ${server.name} Minecraft server?`,
      answer: `To join ${server.name}, launch Minecraft and use the server address: ${server.address}${
        server.port == 25565 ? "" : `:${server.port}`
      }. Click "Multiplayer" in the main menu, then "Add Server", paste the address, and click "Done" to save. Then select the server and click "Join Server" to connect.`,
    },
    {
      question: `How many players are online on ${server.name}?`,
      answer: `Currently, ${currentPlayers} ${currentPlayers === 1 ? "player is" : "players are"} online on ${
        server.name
      } out of a maximum capacity of ${maxPlayers} players. You can view real-time player statistics and historical data on this page.`,
    },
    {
      question: `What version of Minecraft does ${server.name} support?`,
      answer: server.version
        ? `${server.name} is running Minecraft version ${server.version}. Make sure your Minecraft client is compatible with this version to join the server.`
        : `${server.name} supports multiple Minecraft versions. Check the server information above for the current version details.`,
    },
    {
      question: `Is ${server.name} online and accessible?`,
      answer: `Yes, ${server.name} is currently monitored every 10 minutes. The latest statistics show the server is ${
        currentPlayers > 0 ? "online with active players" : "online"
      }. Historical uptime and player count data is available on this page.`,
    },
    {
      question: `Can I see player statistics for ${server.name}?`,
      answer: `Yes, this page provides comprehensive statistics for ${server.name} including current player count, maximum players, historical player trends, daily and weekly growth statistics, and server uptime monitoring. Stats are updated every 10 minutes.`,
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center gap-2 border-b border-border px-6 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Icon icon="material-symbols:help-outline" className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
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
