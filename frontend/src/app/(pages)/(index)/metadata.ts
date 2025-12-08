import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Minecraft Stats - Track & Analyze Your Server Performance',
  description:
    'Free Minecraft server statistics and analytics platform. Track player counts in real-time, monitor growth trends, and analyze server performance. Join thousands of server owners using our platform.',
  openGraph: {
    title: 'Minecraft Stats - Track & Analyze Your Server Performance',
    description:
      'Free Minecraft server analytics platform. Monitor player counts, track growth trends, and analyze server performance in real-time. Join thousands of server owners.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://minecraft-stats.fr',
  },
};
