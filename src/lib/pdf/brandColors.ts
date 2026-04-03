/**
 * Derives a full PDF color palette from the corretora's brand hex colors.
 * Falls back to the default Marsala palette when no custom colors are set.
 */

export type RGB = [number, number, number];

export interface BrandPalette {
  primary: RGB;
  primaryDark: RGB;
  primaryLight: RGB;   // tinted background
  cream: RGB;          // very light tint for card backgrounds
  surface: RGB;
  white: RGB;
  textDark: RGB;
  textBody: RGB;
  textMuted: RGB;
  border: RGB;
  green: RGB;
  greenLight: RGB;
  gold: RGB;
}

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function darken(rgb: RGB, amount = 0.2): RGB {
  return rgb.map((c) => Math.max(0, Math.round(c * (1 - amount)))) as RGB;
}

function lighten(rgb: RGB, amount = 0.85): RGB {
  return rgb.map((c) => Math.round(c + (255 - c) * amount)) as RGB;
}

function tint(rgb: RGB, amount = 0.92): RGB {
  return rgb.map((c) => Math.round(c + (255 - c) * amount)) as RGB;
}

const DEFAULT_PRIMARY = "#955251";
const DEFAULT_SECONDARY = "#7a3f3e";

export function buildBrandPalette(
  corPrimaria?: string | null,
  corSecundaria?: string | null,
): BrandPalette {
  const primary = hexToRgb(corPrimaria || DEFAULT_PRIMARY);
  const primaryDark = corSecundaria ? hexToRgb(corSecundaria) : darken(primary);

  return {
    primary,
    primaryDark,
    primaryLight: lighten(primary, 0.7),
    cream: tint(primary, 0.93),
    surface: [248, 248, 248],
    white: [255, 255, 255],
    textDark: [24, 24, 27],
    textBody: [63, 63, 70],
    textMuted: [113, 113, 122],
    border: [228, 228, 231],
    green: [22, 163, 74],
    greenLight: [220, 252, 231],
    gold: [202, 138, 4],
  };
}
