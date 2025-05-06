"use client";

import Script from "next/script";

export default function UmamiScript() {
  return (
    <Script
      src="https://cloud.umami.is/script.js"
      data-website-id="5d6e6503-4900-4388-86c8-b7dd23f42037"
      strategy="afterInteractive"
    />
  );
}
