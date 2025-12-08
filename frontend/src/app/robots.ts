import { MetadataRoute } from 'next';
import { getDomainConfig } from '@/lib/domain-server';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { baseUrl } = await getDomainConfig();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account/*',
          '/api/*',
          '/_next/*',
          '/login',
          '/sign-up',
          '/verify-email/*',
          '/callback/*',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
