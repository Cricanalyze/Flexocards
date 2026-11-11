import { Photo, metaLine } from "./layouts";
import { fitSize } from "@/lib/cardUtils";
import { withDefaults, rgba } from "@/lib/designDefaults";

const abs = (s) => ({ position: "absolute", ...s });
const JUSTIFY = { left: "flex-start", center: "center", right: "flex-end" };

const textOf = (k, d, sport) => ({
  name: d.name || "Your Name",
  nickname: d.show.nickname && d.nickname,
  meta: metaLine(d, sport),
  rating: d.show.rating && d.rating && d.rating.slice(0, 5),
  jersey: d.show.jersey && d.jersey && `#${d.jersey.slice(0, 3)}`,
  sport: sport?.name,
  season: d.show.season && d.season,
  tagline: d.show.tagline && d.tagline,
  achievements: d.show.achievements && d.achievements?.length > 0 && `★ ${d.achievements.slice(0, 2).join("  ★ ")}`,
  social: d.show.social && d.social && d.social.slice(0, 30),
}[k]);

const TextEl = ({ el, text, a, fit }) => {
  const size = fit ? fitSize(text, el.size, Math.max(4, Math.round(el.w / (el.size * 0.48))), 10) : el.size;
  return (
    <div style={abs({ left: el.x, top: el.y, width: el.w, height: el.h, display: "flex", alignItems: "center", justifyContent: JUSTIFY[el.align] || "flex-start",
      background: el.bg_alpha ? rgba(el.bg_color, el.bg_alpha) : "transparent", borderRadius: el.radius, overflow: "hidden",
      padding: el.bg_alpha ? "0 6px" : 0, boxSizing: "border-box" })}>
      <span style={{ fontFamily: `'${el.font}', sans-serif`, fontSize: size, fontWeight: el.weight, color: el.use_accent ? a : el.color, lineHeight: 1,
        textTransform: el.upper ? "uppercase" : "none", fontStyle: el.italic ? "italic" : "normal", letterSpacing: el.letter,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: el.align, maxWidth: "100%" }}>{text}</span>
    </div>
  );
};

const Stats = ({ el, stats, a }) => (
  <div style={abs({ left: el.x, top: el.y, width: el.w, height: el.h, overflow: "hidden", display: "grid", gridTemplateColumns: `repeat(${el.cols || 3},1fr)`, gap: 6, alignContent: "start" })}>
    {stats.map((s) => (
      <div key={s.key} style={{ background: rgba(el.box_color, el.box_alpha), borderLeft: el.accent_bar ? `3px solid ${a}` : "none", borderRadius: 6, padding: "5px 8px", minWidth: 0 }}>
        <div style={{ fontFamily: `'${el.font}', monospace`, fontWeight: 700, fontSize: el.size, color: el.value_color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.value}</div>
        <div style={{ fontSize: el.label_size, letterSpacing: 1, textTransform: "uppercase", color: el.label_color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
      </div>
    ))}
  </div>
);

export const CustomLayout = ({ d, sport, photo, a, stats, wm, tpl }) => {
  const g = withDefaults(tpl?.design);
  const { photo: p, stats: st, ...texts } = g.els;
  return (
    <div style={abs({ inset: 0, background: g.bg_color, borderRadius: g.radius, overflow: "hidden", color: "#fff",
      border: g.border_width ? `${g.border_width}px solid ${g.border_accent ? a : g.border_color}` : "none", boxSizing: "border-box" })} data-testid="custom-layout">
      {g.bg_image && <img src={g.bg_image} alt="" draggable={false} crossOrigin="anonymous" style={abs({ inset: 0, width: "100%", height: "100%", objectFit: "cover" })} />}
      {g.overlay > 0 && <div style={abs({ inset: 0, background: `rgba(0,0,0,${g.overlay})` })} />}
      {p.visible && <Photo photo={photo} tint={a} style={{ left: p.x, top: p.y, width: p.w, height: p.h, borderRadius: p.radius, border: p.border_width ? `${p.border_width}px solid ${p.border_color}` : "none", boxSizing: "border-box" }} />}
      {st.visible && d.show.stats && <Stats el={st} stats={stats} a={a} />}
      {Object.entries(texts).map(([k, el]) => {
        const text = el.visible && textOf(k, d, sport);
        return text ? <TextEl key={k} el={el} text={text} a={a} fit={k === "name"} /> : null;
      })}
      {wm && <div style={abs({ bottom: 6, left: 0, right: 0, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 7, letterSpacing: 2, color: "rgba(255,255,255,.55)" })}>MADE WITH FLEXOCARDS</div>}
    </div>
  );
};
