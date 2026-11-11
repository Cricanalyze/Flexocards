import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlayerCard } from "@/components/card/PlayerCard";
import { CARD_W, CARD_H, demoFor } from "@/lib/cardUtils";
import { ELEMENTS, withDefaults, defaultDesign } from "@/lib/designDefaults";
import { useAppData } from "@/context/AppData";
import { ElementInspector, CanvasInspector } from "./DesignerInspector";

const LABELS = Object.fromEntries(ELEMENTS);

function useDemo(sports) {
  return useMemo(() => {
    if (!sports.length) return null;
    const d = demoFor(0, sports);
    const show = Object.fromEntries(Object.keys(d.data.show).map((k) => [k, true]));
    return { ...d, data: { ...d.data, show, nickname: d.data.nickname || "The Finisher", rating: d.data.rating || "92", jersey: d.data.jersey || "18",
      tagline: d.data.tagline || "My game. My identity.", achievements: d.data.achievements?.length ? d.data.achievements : ["Player of the Series"], social: d.data.social || "@flexoplayer" } };
  }, [sports]);
}

function Canvas({ t, g, sel, setSel, setEl, demo }) {
  const drag = useRef(null);
  const down = (k, mode) => (e) => {
    e.stopPropagation(); e.preventDefault();
    setSel(k);
    drag.current = { k, mode, sx: e.clientX, sy: e.clientY, el: { ...g.els[k] } };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    const m = drag.current;
    if (!m) return;
    const dx = Math.round(e.clientX - m.sx), dy = Math.round(e.clientY - m.sy);
    if (m.mode === "move") setEl(m.k, { x: Math.max(-40, Math.min(CARD_W - 10, m.el.x + dx)), y: Math.max(-40, Math.min(CARD_H - 8, m.el.y + dy)) });
    else setEl(m.k, { w: Math.max(10, m.el.w + dx), h: Math.max(8, m.el.h + dy) });
  };
  const up = () => (drag.current = null);
  return (
    <div className="relative select-none touch-none shrink-0" style={{ width: CARD_W, height: CARD_H }} onPointerDown={() => setSel("")} data-testid="designer-canvas">
      <PlayerCard template={{ ...t, layout: "custom", design: g }} sport={demo.sport} data={demo.data} photo={demo.photo} />
      {Object.entries(g.els).filter(([, el]) => el.visible).map(([k, el]) => (
        <div key={k} onPointerDown={down(k, "move")} onPointerMove={move} onPointerUp={up} onPointerCancel={up} data-testid={`designer-box-${k}`}
          className={`absolute cursor-move ${sel === k ? "outline outline-2 outline-amber-400 z-20" : "outline-dashed outline-1 outline-white/40 hover:outline-amber-300 z-10"}`}
          style={{ left: el.x, top: el.y, width: el.w, height: el.h }}>
          {sel === k && <span className="absolute -top-4 left-0 text-[9px] font-bold uppercase bg-amber-400 text-black px-1 rounded-sm whitespace-nowrap">{LABELS[k]}</span>}
          <div onPointerDown={down(k, "resize")} onPointerMove={move} onPointerUp={up} className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-amber-400 border border-black cursor-se-resize rounded-sm" data-testid={`designer-resize-${k}`} />
        </div>
      ))}
    </div>
  );
}

function Layers({ g, sel, setSel, setEl }) {
  return (
    <div className="flex flex-wrap gap-1" data-testid="designer-layers">
      <button onClick={() => setSel("")} data-testid="designer-layer-canvas" className={`px-2.5 h-7 rounded-full text-[11px] font-semibold border ${sel === "" ? "bg-amber-500 text-slate-950 border-amber-500" : "border-border hover:bg-accent"}`}>Background & card</button>
      {ELEMENTS.map(([k, l]) => (
        <span key={k} className={`inline-flex items-center rounded-full border text-[11px] font-semibold ${sel === k ? "bg-amber-500 text-slate-950 border-amber-500" : "border-border"}`}>
          <button className="pl-2.5 pr-1 h-7" onClick={() => setSel(k)} data-testid={`designer-layer-${k}`}>{l}</button>
          <button className="pr-2 h-7 opacity-70 hover:opacity-100" onClick={() => setEl(k, { visible: !g.els[k].visible })} aria-label={`Toggle ${l}`} data-testid={`designer-visibility-${k}`}>
            {g.els[k].visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
        </span>
      ))}
    </div>
  );
}

export function TemplateDesigner({ t, onDone, onCancel }) {
  const { sports } = useAppData();
  const demo = useDemo(sports);
  const [g, setG] = useState(() => withDefaults(t.design));
  const [sel, setSel] = useState("name");
  const setEl = (k, patch) => setG((s) => ({ ...s, els: { ...s.els, [k]: { ...s.els[k], ...patch } } }));
  useEffect(() => {
    const onKey = (e) => {
      if (!sel || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) || ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      e.preventDefault();
      const n = e.shiftKey ? 10 : 1;
      setG((s) => { const el = s.els[sel]; const d = { ArrowUp: [0, -n], ArrowDown: [0, n], ArrowLeft: [-n, 0], ArrowRight: [n, 0] }[e.key];
        return { ...s, els: { ...s.els, [sel]: { ...el, x: el.x + d[0], y: el.y + d[1] } } }; });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel]);
  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-6xl max-h-[94vh] overflow-y-auto" data-testid="template-designer-dialog">
        <DialogHeader>
          <DialogTitle className="font-display uppercase text-2xl">Design editor · {t.name || "New template"}</DialogTitle>
          <DialogDescription>Drag any box to move it, pull the corner to resize, or use arrow keys (Shift = 10px). The preview uses sample player data.</DialogDescription>
        </DialogHeader>
        <Layers g={g} sel={sel} setSel={setSel} setEl={setEl} />
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="rounded-2xl bg-[repeating-conic-gradient(#1e293b_0_25%,#0f172a_0_50%)] [background-size:20px_20px] p-6 overflow-auto max-w-full">
            {demo && <Canvas t={t} g={g} sel={sel} setSel={setSel} setEl={setEl} demo={demo} />}
          </div>
          <div className="flex-1 min-w-0 space-y-3" data-testid="designer-inspector">
            <p className="eyebrow">{sel ? LABELS[sel] : "Background & card"}</p>
            {sel ? <ElementInspector k={sel} el={g.els[sel]} set={(p) => setEl(sel, p)} /> : <CanvasInspector g={g} set={(p) => setG((s) => ({ ...s, ...p }))} />}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
              <Button onClick={() => onDone(g)} data-testid="designer-apply-button">Apply design</Button>
              <Button variant="outline" onClick={onCancel} data-testid="designer-cancel-button">Cancel</Button>
              <Button variant="ghost" onClick={() => setG(defaultDesign())} data-testid="designer-reset-button"><RotateCcw className="w-4 h-4 mr-1" />Reset to default</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Apply, then press “Save template” to publish your changes.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
