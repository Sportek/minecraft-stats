import { Metadata } from 'next';
import { getDomainConfig } from '@/lib/domain-server';

export const generateMetadata = async (): Promise<Metadata> => {
  const { baseUrl } = await getDomainConfig();

  return {
    title: 'Minecraft Stats - Track & Analyze Your Server Performance',
    description:
      'Free Minecraft server statistics and analytics platform. Track player counts in real-time, monitor growth trends, and analyze server performance. Join thousands of server owners using our platform.',
    openGraph: {
      title: 'Minecraft Stats - Track & Analyze Your Server Performance',
      description:
        'Free Minecraft server analytics platform. Monitor player counts, track growth trends, and analyze server performance in real-time. Join thousands of server owners.',
      type: 'website',
      url: baseUrl,
    },
  };
};
