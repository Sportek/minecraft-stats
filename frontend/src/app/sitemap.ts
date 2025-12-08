import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://minecraft-stats.fr';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.minecraft-stats.fr/api/v1';

interface Server {
  id: number;
  name: string;
  updatedAt: string;
}

async function getAllServers(): Promise<Server[]> {
  try {
    const response = await fetch(`${API_URL}/servers`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      console.error('Failed to fetch servers for sitemap');
      return [];
    }

    const data = await response.json();
    return data.map((item: any) => ({
      id: item.server.id,
      name: item.server.name,
      updatedAt: item.server.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching servers for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const servers = await getAllServers();

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/partners`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/cgu`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamic server routes
  const serverRoutes: MetadataRoute.Sitemap = servers.map((server) => {
    const slug = server.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return {
      url: `${BASE_URL}/servers/${server.id}/${slug}`,
      lastModified: new Date(server.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    };
  });

  return [...routes, ...serverRoutes];
}
