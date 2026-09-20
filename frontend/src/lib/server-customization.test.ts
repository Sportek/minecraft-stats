import { describe, expect, it } from "vitest";
import { cardEffectVars, titleColorStyle } from "./server-customization";

const style = (titleColor: string | null, titleColorEnd: string | null = null) => ({
  titleFont: null,
  titleColor,
  titleColorEnd,
});

describe("titleColorStyle", () => {
  it("ne pose aucun style sans couleur", () => {
    expect(titleColorStyle(style(null))).toEqual({});
  });

  it("ignore la couleur de fin quand il n'y a pas de couleur de départ", () => {
    expect(titleColorStyle(style(null, "#ffcc00"))).toEqual({});
  });

  it("colore le titre en uni avec une seule couleur", () => {
    expect(titleColorStyle(style("#ff8800"))).toEqual({ color: "#ff8800" });
  });

  it("dessine un dégradé clippé sur le texte avec deux couleurs", () => {
    expect(titleColorStyle(style("#ff8800", "#ffcc00"))).toEqual({
      backgroundImage: "linear-gradient(90deg, #ff8800, #ffcc00)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
    });
  });
});

describe("cardEffectVars", () => {
  it("transmet la couleur du titre à l'effet néon", () => {
    expect(cardEffectVars({ cardEffect: "neon", titleColor: "#00ffcc" })).toEqual({
      "--effect-color": "#00ffcc",
    });
  });

  it("ne pose rien pour les autres effets ni sans couleur", () => {
    expect(cardEffectVars({ cardEffect: "frost", titleColor: "#00ffcc" })).toBeUndefined();
    expect(cardEffectVars({ cardEffect: "neon", titleColor: null })).toBeUndefined();
    expect(cardEffectVars({ cardEffect: null, titleColor: null })).toBeUndefined();
  });
});
