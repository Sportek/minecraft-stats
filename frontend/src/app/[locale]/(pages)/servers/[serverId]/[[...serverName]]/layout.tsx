import { getServer } from "@/http/server";
import { getLastStat } from "@/utils/stats";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates, getDomainConfig, getOpenGraphLocales } from "@/lib/domain-server";
import { isServerIndexable, serverPath } from "@/lib/server-url";
import { redirect } from "@/i18n/navigation";

// ISR — la metadata (OG, title, description) est rebuild toutes les 10 minutes
// au lieu d'être re-fetched à chaque requête (P.4.3 ; remplace force-dynamic).
export const revalidate = 600;

export const generateMetadata = async (props: {
  params: Promise<{ locale: string; serverId: string; serverName: string[] }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const { backendUrl } = await getDomainConfig();
  const assetsBase = process.env.NEXT_PUBLIC_ASSETS_URL || backendUrl;
  const t = await getTranslations({ locale: params.locale, namespace: "Servers" });
  try {
    const server = await getServer(Number(params.serverId));
    const lastStat = getLastStat(server.stats);
    const playerCount = lastStat.playerCount ?? 0;
    const categories = server.categories.map((c) => c.name).join(", ");
    const languages = server.server.languages.map((l) => l.name).join(", ");
    const imageUrl = `${assetsBase}${server.server.imageUrl}.webp`;

    // Dead servers (no successful ping for a month) are thin pages Google drops as
    // "crawled, currently not indexed". Tell it explicitly rather than letting it guess.
    const indexable = isServerIndexable(server.server.lastStatsAt);

    const title = t("meta.title", { name: server.server.name });
    const description = t("meta.description", {
      name: server.server.name,
      categories,
      playerCount,
      languages,
    });

    const { canonical, languages: alternateLanguages } = buildAlternates(
      params.locale,
      serverPath(server.server.id, server.server.name),
    );
    const og = getOpenGraphLocales(params.locale);

    return {
      title,
      description,
      keywords: [
        "minecraft server",
        server.server.name,
        ...server.categories.map((c) => c.name),
        "player count",
        "server stats",
        "minecraft statistics",
        "minecraft analytics",
        "server monitoring",
      ].join(", "),
      authors: [{ name: "Minecraft Stats" }],
      openGraph: {
        title,
        description,
        type: "website",
        url: canonical,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${server.server.name} Minecraft Server Statistics`,
          },
        ],
        siteName: "Minecraft Stats",
        locale: og.locale,
        alternateLocale: og.alternateLocale,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
        creator: "@MinecraftStats",
      },
      alternates: {
        canonical,
        languages: alternateLanguages,
      },
      robots: {
        index: indexable,
        follow: true,
        googleBot: {
          index: indexable,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error("Erreur", error);
    return {
      title: t("meta.notFoundTitle"),
      description: t("meta.notFoundDescription"),
      openGraph: {
        title: t("meta.notFoundTitle"),
        description: t("meta.notFoundDescription"),
        type: "website",
        siteName: "Minecraft Stats",
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }
};

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; serverId: string; serverName?: string[] }>;
}) => {
  const { locale, serverId, serverName } = await params;

  // Collapse every non-canonical spelling of a server URL (raw display name, wrong
  // slug, missing slug) onto the canonical slug with a redirect, so Google stops
  // bucketing the variants as "duplicate without user-selected canonical".
  let canonicalPath: string | null = null;
  try {
    const { server } = await getServer(Number(serverId));
    canonicalPath = serverPath(server.id, server.name);
  } catch {
    // Unknown/unreachable server — let the client page render its not-found state.
  }

  if (canonicalPath) {
    const requestedPath = `/servers/${serverId}${serverName?.length ? `/${serverName.join("/")}` : ""}`;
    if (requestedPath !== canonicalPath) {
      redirect({ href: canonicalPath, locale });
    }
  }

  return <>{children}</>;
};

export default Layout;
