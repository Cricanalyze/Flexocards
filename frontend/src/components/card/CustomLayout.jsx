import { Photo, metaLine } from "./layouts";
import { fitSize } from "@/lib/cardUtils";
import { withDefaults, rgba } from "@/lib/designDefaults";

const abs = (s) => ({ position: "absolute", ...s });
const JUSTIFY = { left: "flex-start", center: "center", right: "flex-end" };
export const SHAPES = {
  rect: "none",
  arch: "inset(0 round 50% 50% 0 0 / 34% 34% 0 0)",
  circle: "circle(50% at 50% 50%)",
  hex: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
  diamond: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
  shield: "polygon(0 0, 100% 0, 100% 72%, 50% 100%, 0 72%)",
  slant: "polygon(0 0, 100% 0, 100% 86%, 0 100%)",
};

const textOf = (k, d, sport) => ({
  name: d.name || "Your Name",
  nickname: d.show.nickname && d.nickname,
  meta: metaLine(d, sport),
  rating: d.show.rating && d.rating && d.rating.slice(0, 5),
  jersey: d.show.jersey && d.jersey && `${d.jersey.slice(0, 3)}`,
  sport: sport?.name,
  season: d.show.season && d.season,
  tagline: d.show.tagline && d.tagline,
  achievements: d.show.achievements && d.achievements?.length > 0 && `★ ${d.achievements.slice(0, 2).join("  ★ ")}`,
  social: d.show.social && d.social && d.social.slice(0, 30),
}[k]);

const TextEl = ({ el, text, a }) => {
  const size = fitSize(text, el.size, Math.max(2, Math.floor(el.w / (el.size * 0.68))), Math.max(6, Math.round(el.size * 0.45)));
  const col = el.use_accent ? a : el.color;
  return (
    <div style={abs({ left: el.x, top: el.y, width: el.w, height: el.h, display: "flex", alignItems: "center", justifyContent: JUSTIFY[el.align] || "flex-start",
      background: el.bg_alpha ? rgba(el.bg_accent ? a : el.bg_color, el.bg_alpha) : "transparent", borderRadius: el.radius, overflow: "hidden",
      padding: el.bg_alpha ? "0 6px" : 0, boxSizing: "border-box", opacity: el.opacity ?? 1 })}>
      <span style={{ fontFamily: `'${el.font}', sans-serif`, fontSize: size, fontWeight: el.weight, lineHeight: 1,
        color: el.outline ? "transparent" : col, WebkitTextStroke: el.outline ? `1.5px ${col}` : undefined,
        textShadow: el.shadow ? `0 2px 10px ${rgba(el.shadow_accent ? a : el.shadow_color, 0.85)}, 0 1px 2px rgba(0,0,0,.7)` : "none",
        textTransform: el.upper ? "uppercase" : "none", fontStyle: el.italic ? "italic" : "normal", letterSpacing: el.letter,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: el.align, maxWidth: "100%", paddingRight: el.italic ? 4 : 0 }}>{text}</span>
    </div>
  );
};

const Stats = ({ el, stats, a }) => {
  const plain = el.style === "plain";
  return (
    <div style={abs({ left: el.x, top: el.y, width: el.w, height: el.h, overflow: "hidden", display: "grid", gridTemplateColumns: `repeat(${el.cols || 3},1fr)`, gap: plain ? 0 : 6, alignContent: "start" })}>
      {stats.map((s, i) => (
        <div key={s.key} style={{ background: plain ? "transparent" : rgba(el.box_color, el.box_alpha), minWidth: 0, textAlign: el.align || "left",
          borderLeft: plain ? (i % (el.cols || 3) ? `1px solid ${rgba(el.label_color, 0.4)}` : "none") : el.accent_bar ? `3px solid ${a}` : "none",
          borderRadius: el.style === "pills" ? 999 : plain ? 0 : 6, padding: plain ? "2px 8px" : "5px 8px",
          backdropFilter: el.blur ? "blur(6px)" : undefined, border: el.style === "pills" ? `1px solid ${rgba(a, 0.6)}` : undefined }}>
          <div style={{ fontFamily: `'${el.font}', monospace`, fontWeight: 700, fontSize: el.size, color: el.value_accent ? a : el.value_color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.1 }}>{s.value}</div>
          <div style={{ fontSize: el.label_size, letterSpacing: 1, textTransform: "uppercase", color: el.label_color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
};

const PhotoEl = ({ p, photo, a }) => {
  const fade = p.fade ? `linear-gradient(to bottom, #000 ${Math.round((1 - p.fade) * 100)}%, transparent 100%)` : undefined;
  return (
    <div style={abs({ left: p.x, top: p.y, width: p.w, height: p.h, filter: p.glow ? `drop-shadow(0 0 14px ${rgba(a, 0.75)})` : undefined })}>
      {p.border_width > 0 && <div style={abs({ inset: -p.border_width, clipPath: SHAPES[p.shape] || "none", borderRadius: p.shape === "rect" ? p.radius + p.border_width : 0, background: p.border_accent ? a : p.border_color })} />}
      <Photo photo={photo} tint={a} style={{ inset: 0, borderRadius: p.shape === "rect" ? p.radius : 0, clipPath: SHAPES[p.shape] || "none", WebkitMaskImage: fade, maskImage: fade }} />
    </div>
  );
};

export const CustomLayout = ({ d, sport, photo, a, stats, wm, tpl }) => {
  const g = withDefaults(tpl?.design);
  const { photo: p, stats: st, ...texts } = g.els;
  const render = (behind) => Object.entries(texts).map(([k, el]) => {
    if (!!el.behind !== behind) return null;
    const text = el.visible && textOf(k, d, sport);
    return text ? <TextEl key={k} el={el} text={text} a={a} /> : null;
  });
  return (
    <div style={abs({ inset: 0, background: g.bg_color, borderRadius: g.radius, overflow: "hidden", color: "#fff",
      border: g.border_width ? `${g.border_width}px solid ${g.border_accent ? a : g.border_color}` : "none", boxSizing: "border-box" })} data-testid="custom-layout">
      {g.bg_image && <img src={g.bg_image} alt="" draggable={false} crossOrigin="anonymous" style={abs({ inset: 0, width: "100%", height: "100%", objectFit: "cover" })} />}
      {g.overlay > 0 && <div style={abs({ inset: 0, background: `rgba(0,0,0,${g.overlay})` })} />}
      {g.grad > 0 && <div style={abs({ left: 0, right: 0, bottom: 0, height: "62%", background: `linear-gradient(to top, ${rgba(g.grad_color, g.grad)} 0%, ${rgba(g.grad_color, g.grad * 0.6)} 45%, transparent 100%)` })} />}
      {render(true)}
      {p.visible && <PhotoEl p={p} photo={photo} a={a} />}
      {st.visible && d.show.stats && <Stats el={st} stats={stats} a={a} />}
      {render(false)}
      {g.frame && <div style={abs({ inset: 8, border: `1.5px solid ${rgba(a, 0.85)}`, borderRadius: Math.max(0, g.radius - 6), pointerEvents: "none", boxShadow: `inset 0 0 18px ${rgba(a, 0.25)}` })} />}
      {wm && <div style={abs({ bottom: 6, left: 0, right: 0, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 7, letterSpacing: 2, color: "rgba(255,255,255,.55)" })}>MADE WITH FLEXOCARDS</div>}
    </div>
  );
};
