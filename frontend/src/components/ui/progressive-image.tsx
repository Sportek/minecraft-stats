'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onError?: () => void;
}

export const ProgressiveImage = ({
  src,
  alt,
  width,
  height,
  className,
  onError
}: ProgressiveImageProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-105 blur-lg' : 'scale-100 blur-0',
          className
        )}
        onLoadingComplete={() => setIsLoading(false)}
        onError={onError}
      />
    </div>
  );
}; 