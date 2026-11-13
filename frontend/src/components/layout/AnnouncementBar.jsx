import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Megaphone } from "lucide-react";
import axios from "axios";
import { API } from "@/lib/api";

const TONES = { amber: "bg-amber-400 text-slate-950", cyan: "bg-cyan-400 text-slate-950", green: "bg-emerald-500 text-slate-950", red: "bg-rose-600 text-white" };
const KEY = "fc_dismissed_announcements";

const Cta = ({ a }) => {
  if (!a.link_url) return null;
  const cls = "ml-2 underline underline-offset-2 font-bold whitespace-nowrap hover:opacity-80";
  const label = `${a.link_label || "Learn more"} →`;
  return a.link_url.startsWith("/") ? <Link to={a.link_url} className={cls} data-testid="announcement-link">{label}</Link>
    : <a href={a.link_url} target="_blank" rel="noreferrer" className={cls} data-testid="announcement-link">{label}</a>;
};

export function AnnouncementBar() {
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);
  const [hidden, setHidden] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } });
  useEffect(() => { axios.get(`${API}/site/announcements`).then((r) => setItems(r.data)).catch(() => {}); }, []);
  const list = items.filter((a) => !hidden.includes(`${a.id}:${a.updated_at}`));
  useEffect(() => {
    if (list.length < 2) return undefined;
    const t = setInterval(() => setI((x) => x + 1), 6000);
    return () => clearInterval(t);
  }, [list.length]);
  if (!list.length) return null;
  const a = list[i % list.length];
  const dismiss = () => { const next = [...hidden, `${a.id}:${a.updated_at}`]; setHidden(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  return (
    <div className={`relative z-50 text-xs sm:text-sm font-semibold ${TONES[a.tone] || TONES.amber}`} data-testid="announcement-bar">
      <div className="container-x flex items-center justify-center gap-2 py-2 pr-8 text-center">
        <Megaphone className="w-4 h-4 shrink-0 hidden sm:block" />
        <p key={a.id} className="animate-[fadeIn_.4s_ease]" data-testid="announcement-text">{a.text}<Cta a={a} /></p>
        {list.length > 1 && <span className="hidden sm:inline text-[10px] opacity-70 font-mono">{(i % list.length) + 1}/{list.length}</span>}
      </div>
      <button onClick={dismiss} aria-label="Dismiss announcement" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/10" data-testid="announcement-dismiss-button"><X className="w-4 h-4" /></button>
    </div>
  );
}
