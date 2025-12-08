import { Metadata } from 'next';
import { getDomainConfig } from '@/lib/domain-server';

export const generateMetadata = async (): Promise<Metadata> => {
  const { baseUrl } = await getDomainConfig();

  return {
    title: 'Our Partners - Minecraft Stats',
    description:
      'Discover our trusted partners offering services to enhance your Minecraft server experience. Find server lists, voting platforms, and useful Minecraft tools.',
    keywords:
      'minecraft partners, minecraft server list, server voting, minecraft tools, server promotion',
    openGraph: {
      title: 'Our Partners - Minecraft Stats',
      description:
        'Discover trusted services and tools for Minecraft server owners. Server lists, voting platforms, and more.',
      type: 'website',
      url: `${baseUrl}/partners`,
    },
    alternates: {
      canonical: `${baseUrl}/partners`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
};
