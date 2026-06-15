import DOMPurify from "isomorphic-dompurify";
import MarkdownIt from "markdown-it";

/**
 * Rendu Markdown -> HTML pour le contenu des articles de blog.
 *
 * `html: true` laisse passer le HTML brut tel quel : les anciens articles
 * stockés en HTML (éditeur TipTap historique) restent donc rendus correctement,
 * tandis que les nouveaux articles écrits en Markdown sont convertis. Aucune
 * migration n'est nécessaire.
 *
 * Comme `html: true` autorise du HTML arbitraire, et que le contenu peut inclure
 * des données non fiables (placeholders %SERVER_VERSION%/%ADDRESS% alimentés par
 * le ping d'un serveur distant, ou un compte `writer` compromis), on passe
 * systématiquement le HTML rendu par DOMPurify avant injection via
 * `dangerouslySetInnerHTML`. Les balises de mise en forme restent autorisées ;
 * `<script>`, les attributs gestionnaires d'événements et les URLs
 * `javascript:`/`data:` dangereuses sont supprimés.
 */
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
});

export function renderMarkdown(content: string | null | undefined): string {
  if (!content) return "";
  return DOMPurify.sanitize(md.render(content), {
    USE_PROFILES: { html: true },
  });
}
