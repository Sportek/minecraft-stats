import MarkdownIt from "markdown-it";

/**
 * Rendu Markdown -> HTML pour le contenu des articles de blog.
 *
 * `html: true` laisse passer le HTML brut tel quel : les anciens articles
 * stockés en HTML (éditeur TipTap historique) restent donc rendus correctement,
 * tandis que les nouveaux articles écrits en Markdown sont convertis. Aucune
 * migration n'est nécessaire.
 *
 * Le contenu est rédigé par des auteurs/admins authentifiés (route protégée par
 * policy), au même niveau de confiance que le rendu HTML précédent.
 */
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
});

export function renderMarkdown(content: string | null | undefined): string {
  if (!content) return "";
  return md.render(content);
}
