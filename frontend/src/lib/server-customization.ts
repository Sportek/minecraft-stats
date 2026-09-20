import type { CSSProperties } from "react";
import type { CardEffect, Server, TitleFont } from "@/types/server";

export const TITLE_FONTS: readonly TitleFont[] = [
  "minecraft",
  "pixel",
  "medieval",
  "fantasy",
  "bungee",
  "rounded",
  "script",
  "future",
  "marker",
];

export const CARD_EFFECTS: readonly CardEffect[] = ["frost", "enchanted", "embers", "neon"];

/** 468x60 : le format standard des sites de vote, exigé tel quel par l'API. */
export const BANNER_WIDTH = 468;
export const BANNER_HEIGHT = 60;

/** Sous-ensemble du serveur qui pilote le rendu du titre. */
export type TitleStyle = Pick<Server, "titleFont" | "titleColor" | "titleColorEnd">;

/**
 * Couleur du titre : unie, ou dégradé horizontal quand une seconde couleur est
 * fournie. Le dégradé passe par `background-clip: text`, seule façon de colorer du
 * texte avec un dégradé en CSS.
 */
export function titleColorStyle({ titleColor, titleColorEnd }: TitleStyle): CSSProperties {
  if (!titleColor) return {};
  if (!titleColorEnd) return { color: titleColor };
  return {
    backgroundImage: `linear-gradient(90deg, ${titleColor}, ${titleColorEnd})`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
  };
}

/**
 * Variable CSS lue par l'effet « néon » : il reprend la couleur du titre pour que
 * la carte et le nom restent cohérents. Sans couleur, le CSS retombe sur l'accent du thème.
 */
export function cardEffectVars({ cardEffect, titleColor }: Pick<Server, "cardEffect" | "titleColor">) {
  if (cardEffect !== "neon" || !titleColor) return undefined;
  // Les propriétés personnalisées ne font pas partie de `CSSProperties`.
  return { "--effect-color": titleColor } as CSSProperties;
}
