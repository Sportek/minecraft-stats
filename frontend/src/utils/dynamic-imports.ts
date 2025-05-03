'use client';

import dynamic from 'next/dynamic';
import type { IconProps } from '@iconify/react';
import React from 'react';

// Composant de chargement
const IconLoading = () => React.createElement('span', { className: 'w-6 h-6 block' });

// Composants qui peuvent être chargés dynamiquement
export const DynamicIcon = dynamic<IconProps>(() => 
  import('@iconify/react').then((mod) => mod.Icon), {
    ssr: false,
    loading: IconLoading
  }
);

// Autres composants dynamiques à ajouter ici... 