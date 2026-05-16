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
  const reset =
    "*{box-sizing:border-box}html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}";
  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${reset}</style></head><body>${htmlContent}</body></html>`;

  return (
    <iframe
      title="Prévisualisation de la publicité"
      srcDoc={srcDoc}
      sandbox=""
      className={
        className ??
        "block h-[130px] w-full rounded-lg border border-gray-300 bg-white dark:border-stats-blue-700 dark:bg-stats-blue-900"
      }
    />
  );
};

export default AdPreview;
