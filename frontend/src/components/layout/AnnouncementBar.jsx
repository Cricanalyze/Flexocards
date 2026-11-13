import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import axios from "axios";
import { API } from "@/lib/api";

const TONES = {
  amber: { bg: "linear-gradient(90deg,#f59e0b,#fbbf24 45%,#f59e0b)", fg: "text-slate-950", chip: "bg-slate-950 text-amber-300" },
  cyan: { bg: "linear-gradient(90deg,#0891b2,#22d3ee 45%,#0891b2)", fg: "text-slate-950", chip: "bg-slate-950 text-cyan-300" },
  green: { bg: "linear-gradient(90deg,#059669,#34d399 45%,#059669)", fg: "text-slate-950", chip: "bg-slate-950 text-emerald-300" },
  red: { bg: "linear-gradient(90deg,#be123c,#f43f5e 45%,#be123c)", fg: "text-white", chip: "bg-white text-rose-600" },
};
const KEY = "fc_dismissed_announcements";
const DELAY = 5000;

const Cta = ({ a, chip }) => {
  if (!a.link_url) return null;
  const cls = `ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-transform duration-200 hover:scale-105 ${chip}`;
  const label = <>{a.link_label || "Learn more"}<ChevronRight className="w-3 h-3" /></>;
  return a.link_url.startsWith("/") ? <Link to={a.link_url} className={cls} data-testid="announcement-link">{label}</Link>
    : <a href={a.link_url} target="_blank" rel="noreferrer" className={cls} data-testid="announcement-link">{label}</a>;
};

const Arrow = ({ dir, onClick }) => (
  <button onClick={onClick} aria-label={dir < 0 ? "Previous announcement" : "Next announcement"} data-testid={`announcement-${dir < 0 ? "prev" : "next"}-button`}
    className="hidden sm:grid place-items-center w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 transition-colors shrink-0">
    {dir < 0 ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
  </button>
);

export function AnnouncementBar() {
  const [items, setItems] = useState([]);
  const [[i, dir], setPos] = useState([0, 1]);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } });
  useEffect(() => { axios.get(`${API}/site/announcements`).then((r) => setItems(r.data)).catch(() => {}); }, []);
  const list = items.filter((a) => !hidden.includes(`${a.id}:${a.updated_at}`));
  const n = list.length;
  const go = (d) => setPos(([x]) => [(x + d + n) % n, d]);
  useEffect(() => {
    if (n < 2 || paused) return undefined;
    const t = setTimeout(() => go(1), DELAY);
    return () => clearTimeout(t);
  }, [n, paused, i]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!n) return null;
  const idx = i % n;
  const a = list[idx];
  const tone = TONES[a.tone] || TONES.amber;
  const dismiss = () => { const next = [...hidden, `${a.id}:${a.updated_at}`]; setHidden(next); localStorage.setItem(KEY, JSON.stringify(next)); setPos([0, 1]); };
  return (
    <div className={`relative z-50 overflow-hidden ${tone.fg} transition-[background] duration-500`} style={{ background: tone.bg }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} data-testid="announcement-bar">
      <div className="pointer-events-none absolute inset-0 announce-shine" />
      <div className="container-x relative flex items-center gap-2 sm:gap-3 h-10 pr-8">
        {n > 1 && <Arrow dir={-1} onClick={() => go(-1)} />}
        <span className={`hidden md:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] shrink-0 ${tone.chip}`}><Sparkles className="w-3 h-3" />New</span>
        <div className="relative flex-1 min-w-0 h-full">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div key={a.id} custom={dir} className="absolute inset-0 flex items-center justify-center text-center"
              initial={{ y: dir > 0 ? 24 : -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: dir > 0 ? -24 : 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }} drag={n > 1 ? "x" : false} dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 40) go(info.offset.x < 0 ? 1 : -1); }}>
              <p className="truncate text-[11px] sm:text-sm font-semibold" data-testid="announcement-text">{a.text}</p>
              <Cta a={a} chip={tone.chip} />
            </motion.div>
          </AnimatePresence>
        </div>
        {n > 1 && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0" data-testid="announcement-dots">
            {list.map((x, k) => (
              <button key={x.id} onClick={() => setPos([k, k > idx ? 1 : -1])} aria-label={`Announcement ${k + 1}`} data-testid={`announcement-dot-${k}`}
                className={`h-1.5 rounded-full bg-current transition-[width,opacity] duration-300 ${k === idx ? "w-5 opacity-90" : "w-1.5 opacity-35 hover:opacity-60"}`} />
            ))}
          </div>
        )}
        {n > 1 && <Arrow dir={1} onClick={() => go(1)} />}
      </div>
      {n > 1 && !paused && <motion.div key={`p${idx}`} className="absolute bottom-0 left-0 h-[2px] bg-current opacity-40" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: DELAY / 1000, ease: "linear" }} />}
      <button onClick={dismiss} aria-label="Dismiss announcement" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/15 transition-colors" data-testid="announcement-dismiss-button"><X className="w-4 h-4" /></button>
    </div>
  );
}
