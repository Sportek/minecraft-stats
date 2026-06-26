"use client";

import { recordPostView } from "@/http/post";
import { useEffect } from "react";

/**
 * Records a single, best-effort view per browser session per article. The count
 * itself is consent-exempt (no identifier is stored server-side); detailed
 * attribution is handled separately by the analytics page-view pipeline.
 */
export default function ArticleViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;

    const key = `mcstats_post_viewed_${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable (private mode): fall through and still count.
    }

    recordPostView(slug);
  }, [slug]);

  return null;
}
