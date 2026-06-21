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
  // Same minimal reset as the live AdSlot (no body margin, transparent background)
  // so the preview matches the real rendering, including in dark mode.
  const reset = "<style>html,body{margin:0;padding:0;background:transparent}</style>";
  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8">${reset}</head><body>${htmlContent}</body></html>`;

  return (
    <iframe
      title="Prévisualisation de la publicité"
      srcDoc={srcDoc}
      sandbox=""
      className={
        className ?? "block h-[130px] w-full rounded-md border border-border bg-background"
      }
    />
  );
};

export default AdPreview;
