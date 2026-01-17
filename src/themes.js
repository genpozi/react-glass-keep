export const ACCENT_COLORS = [
  { id: 'indigo', name: 'Indigo', hex: '#6366F1', hover: '#4F46E5' },
  { id: 'rose', name: 'Rose', hex: '#F43F5E', hover: '#E11D48' },
  { id: 'emerald', name: 'Emerald', hex: '#10B981', hover: '#059669' },
  { id: 'amber', name: 'Amber', hex: '#F59E0B', hover: '#D97706' },
  { id: 'sky', name: 'Sky', hex: '#0EA5E9', hover: '#0284C7' },
  { id: 'violet', name: 'Violet', hex: '#8B5CF6', hover: '#7C3AED' },
  { id: 'neon', name: 'Neon', hex: '#E11D48', hover: '#BE123C' }, // Adding a neon pinkish red
];

export const THEME_PRESETS = [
  {
    id: 'cyberpunk',
    name: 'Neon Tokyo',
    backgroundId: 'City-Night.png',
    accentId: 'rose',
    overlay: true,
  },
  {
    id: 'zen',
    name: 'Zen Garden',
    backgroundId: 'Bonsai-Plant.png',
    accentId: 'emerald',
    overlay: true,
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    backgroundId: 'Fantasy - Sunset.png',
    accentId: 'amber',
    overlay: true,
  },
  {
    id: 'space',
    name: 'Deep Space',
    backgroundId: null, // Default gradient
    accentId: 'indigo',
    overlay: false,
  }
];

/** ---------- Transparency Presets ---------- */
export const TRANSPARENCY_PRESETS = [
  { id: 'solid', name: 'Solid', opacity: 0.95 },
  { id: 'subtle', name: 'Subtle Glass', opacity: 0.8 },
  { id: 'medium', name: 'Medium Glass', opacity: 0.6 },
  { id: 'frosted', name: 'Frosted', opacity: 0.4 },
  { id: 'airy', name: 'Airy', opacity: 0.25 },
];
export const DEFAULT_TRANSPARENCY = 'medium'; // 0.6 opacity

/** ---------- Colors ---------- */
/* Added 6 pastel boho colors + two-line picker layout via grid-cols-6 */
export const LIGHT_COLORS = {
  default: "rgba(255, 255, 255, 0.6)",
  red: "rgba(252, 165, 165, 0.6)",
  yellow: "rgba(253, 224, 71, 0.6)",
  green: "rgba(134, 239, 172, 0.6)",
  blue: "rgba(147, 197, 253, 0.6)",
  purple: "rgba(196, 181, 253, 0.6)",

  peach: "rgba(255, 183, 178, 0.6)",
  sage: "rgba(197, 219, 199, 0.6)",
  mint: "rgba(183, 234, 211, 0.6)",
  sky: "rgba(189, 224, 254, 0.6)",
  sand: "rgba(240, 219, 182, 0.6)",
  mauve: "rgba(220, 198, 224, 0.6)",
};
export const DARK_COLORS = {
  default: "rgba(40, 40, 40, 0.6)",
  red: "rgba(153, 27, 27, 0.6)",
  yellow: "rgba(154, 117, 21, 0.6)",
  green: "rgba(22, 101, 52, 0.6)",
  blue: "rgba(30, 64, 175, 0.6)",
  purple: "rgba(76, 29, 149, 0.6)",

  peach: "rgba(191, 90, 71, 0.6)",
  sage: "rgba(54, 83, 64, 0.6)",
  mint: "rgba(32, 102, 77, 0.6)",
  sky: "rgba(30, 91, 150, 0.6)",
  sand: "rgba(140, 108, 66, 0.6)",
  mauve: "rgba(98, 74, 112, 0.6)",
};
export const COLOR_ORDER = [
  "default",
  "red",
  "yellow",
  "green",
  "blue",
  "purple",
  "peach",
  "sage",
  "mint",
  "sky",
  "sand",
  "mauve",
];

export const solid = (rgba) => (typeof rgba === "string" ? rgba.replace(/0\.[0-9]+\)$/, "1)") : rgba);

// Get opacity value from transparency preset ID
export const getOpacity = (transparencyId) => {
  const preset = TRANSPARENCY_PRESETS.find(p => p.id === transparencyId);
  return preset ? preset.opacity : 0.6; // default to medium
};

// Apply custom opacity to a color string
export const applyOpacity = (rgbaStr, opacity) => {
  if (!rgbaStr || typeof rgbaStr !== 'string') return rgbaStr;
  return rgbaStr.replace(/[0-9.]+\)$/, `${opacity})`);
};

export const bgFor = (colorKey, dark, transparency = null, globalTransparency = DEFAULT_TRANSPARENCY) => {
  const base = (dark ? DARK_COLORS : LIGHT_COLORS)[colorKey] ||
    (dark ? DARK_COLORS.default : LIGHT_COLORS.default);
  // Use card-specific transparency if set, otherwise use global
  const effectiveTransparency = transparency || globalTransparency;
  const opacity = getOpacity(effectiveTransparency);
  return applyOpacity(base, opacity);
};

/** ---------- Modal light boost ---------- */
export const parseRGBA = (str) => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/.exec(str || "");
  if (!m) return { r: 255, g: 255, b: 255, a: 0.85 };
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 };
};

export const mixWithWhite = (rgbaStr, whiteRatio = 0.8, outAlpha = 0.92) => {
  const { r, g, b } = parseRGBA(rgbaStr);
  const rr = Math.round(255 * whiteRatio + r * (1 - whiteRatio));
  const gg = Math.round(255 * whiteRatio + g * (1 - whiteRatio));
  const bb = Math.round(255 * whiteRatio + b * (1 - whiteRatio));
  return `rgba(${rr}, ${gg}, ${bb}, ${outAlpha})`;
};

export const modalBgFor = (colorKey, dark) => {
  const base = bgFor(colorKey, dark);
  if (dark) return base;
  return mixWithWhite(solid(base), 0.8, 0.92);
};
