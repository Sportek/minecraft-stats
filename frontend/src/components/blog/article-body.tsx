"use client";

import { resolvePlaceholders } from "@/http/post";
import { useEffect, useRef } from "react";

// Doit rester aligné avec PlaceholderService.PLACEHOLDER_REGEX côté backend.
const PLACEHOLDER_REGEX = /%[A-Z_]+_\d+%/g;
const SKELETON_CLASS =
  "ph-skeleton inline-block h-[1em] w-12 animate-pulse rounded bg-muted align-middle";

interface ArticleBodyProps {
  html: string;
  className?: string;
}

/**
 * Rend le contenu HTML d'un article et résout ses placeholders (`%NAME_ID%`) de
 * façon asynchrone : ils s'affichent d'abord en squelette, puis sont remplacés
 * par leur valeur réelle une fois la requête batch revenue. Le rendu de l'article
 * n'est donc jamais bloqué par les requêtes stats (cf. PlaceholderService).
 */
export default function ArticleBody({ html, className }: ArticleBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Collecte les nœuds texte contenant au moins un token.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeValue && node.nodeValue.includes("%") && node.nodeValue.match(PLACEHOLDER_REGEX)) {
        textNodes.push(node as Text);
      }
    }

    // Remplace chaque token par un span squelette, en regroupant par token pour
    // ne demander qu'une fois chaque valeur même si elle apparaît plusieurs fois.
    const spansByToken = new Map<string, HTMLElement[]>();
    for (const textNode of textNodes) {
      const text = textNode.nodeValue ?? "";
      const fragment = document.createDocumentFragment();
      let cursor = 0;

      for (const match of text.matchAll(PLACEHOLDER_REGEX)) {
        const token = match[0];
        const start = match.index ?? 0;
        if (start > cursor) {
          fragment.appendChild(document.createTextNode(text.slice(cursor, start)));
        }

        const span = document.createElement("span");
        span.className = SKELETON_CLASS;
        span.setAttribute("aria-busy", "true");
        fragment.appendChild(span);

        const spans = spansByToken.get(token) ?? [];
        spans.push(span);
        spansByToken.set(token, spans);

        cursor = start + token.length;
      }

      if (cursor < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(cursor)));
      }
      textNode.parentNode?.replaceChild(fragment, textNode);
    }

    const tokens = [...spansByToken.keys()];
    if (tokens.length === 0) return;

    const fill = (token: string, value: string) => {
      for (const span of spansByToken.get(token) ?? []) {
        span.textContent = value;
        span.className = "font-semibold text-foreground";
        span.removeAttribute("aria-busy");
      }
    };

    let cancelled = false;
    resolvePlaceholders(tokens)
      .then((values) => {
        if (cancelled) return;
        for (const token of tokens) fill(token, values[token] ?? token);
      })
      .catch(() => {
        // En cas d'échec, on retombe sur le token brut plutôt qu'un squelette figé.
        if (cancelled) return;
        for (const token of tokens) fill(token, token);
      });

    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
