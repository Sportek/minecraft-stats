import { cn } from "@/lib/utils";
import { titleColorStyle, type TitleStyle } from "@/lib/server-customization";
import { TITLE_FONT_STYLES } from "@/lib/title-fonts";

interface ServerTitleProps {
  name: string;
  style: TitleStyle;
  className?: string;
}

/**
 * Nom du serveur avec la police et la couleur (unie ou dégradée) choisies par son
 * propriétaire. Sans personnalisation, rend le même `<span>` que l'ancien titre en dur.
 */
const ServerTitle = ({ name, style, className }: ServerTitleProps) => {
  const font = style.titleFont ? TITLE_FONT_STYLES[style.titleFont] : null;

  return (
    <span
      className={cn(
        "truncate text-lg font-bold leading-tight text-foreground",
        // Le dégradé ne peint que la boîte du texte : les jambages des polices
        // manuscrites y seraient rognés sans ce léger débord.
        font && "pb-0.5",
        className
      )}
      style={{
        fontFamily: font?.family,
        fontSize: font?.scale ? `${font.scale}em` : undefined,
        ...titleColorStyle(style),
      }}
    >
      {name}
    </span>
  );
};

export default ServerTitle;
