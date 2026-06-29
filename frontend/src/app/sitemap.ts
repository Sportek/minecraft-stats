import { MetadataRoute } from 'next';
import { buildAlternates, buildAlternatesForSlugs, getDomainConfig } from '@/lib/domain-server';
import { isServerIndexable, serverPath } from '@/lib/server-url';

interface Server {
  id: number;
  name: string;
  updatedAt: string;
  lastStatsAt: string | null;
}

interface ServerListItem {
  server: {
    id: number;
    name: string;
    updatedAt: string;
    lastStatsAt: string | null;
  };
}

interface Post {
  slug: string;
  slugs: Record<string, string>;
  publishedAt: string | null;
  updatedAt: string;
}

interface PostsPage {
  meta: { lastPage: number };
  data: Post[];
}

async function getAllServers(apiUrl: string): Promise<Server[]> {
  try {
    const response = await fetch(`${apiUrl}/servers`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      console.error('Failed to fetch servers for sitemap');
      return [];
    }

    const data: ServerListItem[] = await response.json();
    return data.map((item) => ({
      id: item.server.id,
      name: item.server.name,
      updatedAt: item.server.updatedAt,
      lastStatsAt: item.server.lastStatsAt,
    }));
  } catch (error) {
    console.error('Error fetching servers for sitemap:', error);
    return [];
  }
}

async function getAllPosts(apiUrl: string, locale: string): Promise<Post[]> {
  try {
    const posts: Post[] = [];
    let page = 1;
    let lastPage = 1;

    // `/posts` only returns published posts; paginate through every page. The
    // locale resolves each post's primary slug for this domain's URLs.
    do {
      const response = await fetch(`${apiUrl}/posts?page=${page}&limit=100&locale=${locale}`, {
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        console.error('Failed to fetch posts for sitemap');
        break;
      }

      const body: PostsPage = await response.json();
      posts.push(...body.data);
      lastPage = body.meta.lastPage;
      page += 1;
    } while (page <= lastPage);

    return posts;
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { baseUrl, apiUrl } = await getDomainConfig();
  // Per-domain sitemap: .fr lists French URLs, .com English ones.
  const domainLocale = baseUrl.includes('minecraft-stats.fr') ? 'fr' : 'en';
  const [servers, posts] = await Promise.all([
    getAllServers(apiUrl),
    getAllPosts(apiUrl, domainLocale),
  ]);

  // Static routes (path is locale-free; alternates point at each locale's home
  // domain and include x-default, matching the per-page metadata).
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
      alternates: { languages: buildAlternates(domainLocale, "").languages },
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
      alternates: { languages: buildAlternates(domainLocale, "/blog").languages },
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: { languages: buildAlternates(domainLocale, "/about").languages },
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: { languages: buildAlternates(domainLocale, "/contact").languages },
    },
    {
      url: `${baseUrl}/cgu`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: { languages: buildAlternates(domainLocale, "/cgu").languages },
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: { languages: buildAlternates(domainLocale, "/privacy").languages },
    },
  ];

  // Dynamic blog post routes
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
    // Per-locale slugs: advertise only the translations that exist (with x-default).
    alternates: { languages: buildAlternatesForSlugs(domainLocale, post.slugs).languages },
  }));

  // Dynamic server routes. Dead servers (no successful ping for SERVER_STALE_DAYS)
  // are thin pages Google reports as "crawled, currently not indexed"; keeping them
  // out of the sitemap concentrates crawl budget on live servers.
  const serverRoutes: MetadataRoute.Sitemap = servers
    .filter((server) => isServerIndexable(server.lastStatsAt))
    .map((server) => {
      const path = serverPath(server.id, server.name);

      return {
        url: `${baseUrl}${path}`,
        lastModified: new Date(server.updatedAt),
        changeFrequency: 'daily' as const,
        priority: 0.8,
        alternates: { languages: buildAlternates(domainLocale, path).languages },
      };
    });

  return [...routes, ...postRoutes, ...serverRoutes];
}
