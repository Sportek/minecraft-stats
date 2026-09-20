import {
  Bungee,
  Cinzel,
  Fredoka,
  Orbitron,
  Pacifico,
  Permanent_Marker,
  Press_Start_2P,
  Uncial_Antiqua,
} from "next/font/google";
import localFont from "next/font/local";
import type { TitleFont } from "@/types/server";

// Monocraft (Idrees Hassan, SIL OFL 1.1) : recréation libre du style de la police du jeu — la
// police officielle de Mojang n'est pas distribuée. Fichier restreint au latin, cyrillique et
// grec, sans ligatures de code ; licence et détails dans src/fonts/monocraft/.
const minecraft = localFont({
  src: "../fonts/monocraft/Monocraft-Bold.woff",
  weight: "700",
  display: "swap",
  preload: false,
});

// `next/font` exige des littéraux à chaque appel (pas de spread d'options partagées).
// `preload: false` : la police n'est téléchargée que si un titre l'utilise, sinon les
// huit fichiers seraient préchargés sur toutes les pages qui importent ce module.
const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const medieval = Cinzel({ weight: "700", subsets: ["latin"], display: "swap", preload: false });
const fantasy = Uncial_Antiqua({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const bungee = Bungee({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const rounded = Fredoka({ subsets: ["latin"], display: "swap", preload: false });
const script = Pacifico({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const future = Orbitron({ subsets: ["latin"], display: "swap", preload: false });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap", preload: false });

interface TitleFontStyle {
  family: string;
  /** Correction de taille : certaines polices sont bien plus larges que le texte courant. */
  scale?: number;
}

export const TITLE_FONT_STYLES: Record<TitleFont, TitleFontStyle> = {
  minecraft: { family: minecraft.style.fontFamily },
  pixel: { family: pixel.style.fontFamily, scale: 0.8 },
  medieval: { family: medieval.style.fontFamily },
  fantasy: { family: fantasy.style.fontFamily },
  bungee: { family: bungee.style.fontFamily, scale: 0.9 },
  rounded: { family: rounded.style.fontFamily },
  script: { family: script.style.fontFamily },
  future: { family: future.style.fontFamily, scale: 0.9 },
  marker: { family: marker.style.fontFamily },
};
