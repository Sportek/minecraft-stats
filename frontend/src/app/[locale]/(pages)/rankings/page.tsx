import { permanentRedirect } from "next/navigation";
import { getPathname } from "@/i18n/navigation";

/**
 * /rankings n'a pas de contenu propre : chaque classement vit sur sa page
 * dédiée /rankings/<sort>. Redirection permanente vers le classement de
 * référence (joueurs en ligne).
 */
const Rankings = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params;
  // getPathname re-adds the locale prefix (as-needed) that permanentRedirect needs.
  permanentRedirect(getPathname({ href: "/rankings/players", locale }));
};

export default Rankings;
