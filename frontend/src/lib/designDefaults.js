export const FONTS = ["Barlow Condensed", "DM Sans", "JetBrains Mono", "Big Shoulders Display", "Permanent Marker", "Bebas Neue",
  "Oswald", "Anton", "Teko", "Russo One", "Orbitron", "Playfair Display", "Rajdhani"];

export const WEIGHTS = [400, 500, 600, 700, 800, 900];

export const ELEMENTS = [["photo", "Player photo"], ["name", "Name"], ["nickname", "Nickname"], ["meta", "Position · team · country"],
  ["rating", "Rating"], ["jersey", "Jersey number"], ["stats", "Stats"], ["sport", "Sport name"], ["season", "Season"],
  ["tagline", "Tagline"], ["achievements", "Achievements"], ["social", "Social handle"]];

const T = (x, y, w, h, o = {}) => ({ x, y, w, h, visible: true, font: "Barlow Condensed", size: 16, weight: 700, color: "#FFFFFF", use_accent: false,
  align: "left", upper: true, italic: false, letter: 0, bg_color: "#000000", bg_alpha: 0, radius: 0, ...o });
const MONO = { font: "JetBrains Mono", weight: 500 };

export const defaultDesign = () => ({
  bg_color: "#0B0F17", bg_image: "", overlay: 0.25, radius: 16, border_color: "#D4AF37", border_width: 2, border_accent: true,
  els: {
    photo: { x: 16, y: 16, w: 328, h: 280, visible: true, radius: 12, border_color: "#FFFFFF", border_width: 0 },
    rating: T(26, 26, 64, 54, { size: 32, weight: 900, align: "center", color: "#0B0F17", bg_color: "#D4AF37", bg_alpha: 1, radius: 8 }),
    jersey: T(262, 22, 72, 54, { size: 44, weight: 900, align: "right" }),
    nickname: T(24, 300, 312, 16, { ...MONO, size: 10, letter: 3, use_accent: true }),
    name: T(24, 316, 312, 42, { size: 38, weight: 900 }),
    meta: T(24, 360, 312, 16, { ...MONO, size: 10, letter: 1.5, color: "#CBD5E1" }),
    stats: { x: 16, y: 384, w: 328, h: 92, visible: true, cols: 3, font: "JetBrains Mono", size: 15, label_size: 8,
      value_color: "#FFFFFF", label_color: "#94A3B8", box_color: "#FFFFFF", box_alpha: 0.07, accent_bar: true },
    sport: T(18, 478, 160, 14, { ...MONO, size: 9, letter: 2, color: "#94A3B8" }),
    season: T(182, 478, 160, 14, { ...MONO, size: 9, letter: 2, color: "#94A3B8", align: "right" }),
    tagline: T(24, 282, 312, 16, { visible: false, font: "DM Sans", size: 11, weight: 500, upper: false, italic: true }),
    achievements: T(24, 262, 312, 16, { visible: false, font: "DM Sans", size: 10, weight: 500, upper: false, use_accent: true }),
    social: T(24, 458, 312, 14, { visible: false, ...MONO, size: 10, upper: false, use_accent: true }),
  },
});

export const withDefaults = (d) => {
  const base = defaultDesign();
  const els = Object.fromEntries(Object.entries(base.els).map(([k, v]) => [k, { ...v, ...(d?.els?.[k] || {}) }]));
  return { ...base, ...(d || {}), els };
};

export const rgba = (hex, a) => {
  const h = (hex || "#000000").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16) || 0;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a ?? 1})`;
};
