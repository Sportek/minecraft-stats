"use client";

import Script from "next/script";

export default function UmamiScript() {
  const isProduction = typeof window !== 'undefined' && window.location.hostname === 'minecraft-stats.fr';
  const websiteId = isProduction ? "510583d8-f394-44d0-a3be-21612e88277f" : "5d6e6503-4900-4388-86c8-b7dd23f42037";

  return (
    <Script
      src="https://cloud.umami.is/script.js"
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
} 