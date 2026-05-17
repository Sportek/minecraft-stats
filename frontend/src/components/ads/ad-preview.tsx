"use client";

interface AdPreviewProps {
  htmlContent: string;
  className?: string;
}

/**
 * Rendu isolé d'une publicité dans une iframe sandboxée, sans tracking.
 * Utilisé pour la prévisualisation dans le panel admin.
 */
const AdPreview = ({ htmlContent, className }: AdPreviewProps) => {
  // Aucun CSS injecté : rendu identique à l'affichage réel sur le site.
  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${htmlContent}</body></html>`;

  return (
    <iframe
      title="Prévisualisation de la publicité"
      srcDoc={srcDoc}
      sandbox=""
      className={className ?? "block h-[130px] w-full"}
    />
  );
};

export default AdPreview;
