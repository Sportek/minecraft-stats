import { getDomainConfig } from "@/lib/domain-server";

// Rebuild the feed hourly, in line with the blog index.
export const revalidate = 3600;

interface FeedPost {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface PostsPage {
  meta: { lastPage: number };
  data: FeedPost[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function getRecentPosts(apiUrl: string): Promise<FeedPost[]> {
  try {
    const response = await fetch(`${apiUrl}/posts?page=1&limit=50`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    const body: PostsPage = await response.json();
    return body.data;
  } catch (error) {
    console.error("Error fetching posts for feed:", error);
    return [];
  }
}

export async function GET() {
  const { baseUrl, apiUrl } = await getDomainConfig();
  const posts = await getRecentPosts(apiUrl);

  const items = posts
    .map((post) => {
      const url = `${baseUrl}/blog/${post.slug}`;
      const date = new Date(post.publishedAt || post.createdAt).toUTCString();
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      ${post.excerpt ? `<description>${escapeXml(post.excerpt)}</description>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Minecraft Stats Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Latest news, server spotlights, and development updates.</description>
    <language>en</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
