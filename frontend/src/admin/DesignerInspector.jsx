import { useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi, errMsg } from "@/lib/api";
import { FONTS, WEIGHTS } from "@/lib/designDefaults";

const Num = ({ label, value, onChange, step = 1, min, max, id }) => (
  <div className="space-y-1"><Label className="text-[11px]">{label}</Label>
    <Input type="number" step={step} min={min} max={max} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="h-8 text-xs" data-testid={`designer-${id}-input`} /></div>
);

const Color = ({ label, value, onChange, id }) => (
  <div className="space-y-1"><Label className="text-[11px]">{label}</Label>
    <div className="flex gap-1"><input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-8 w-9 shrink-0 rounded" data-testid={`designer-${id}-color`} />
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs font-mono" /></div></div>
);

const Pick = ({ label, value, options, onChange, id }) => (
  <div className="space-y-1"><Label className="text-[11px]">{label}</Label>
    <Select value={String(value)} onValueChange={onChange}><SelectTrigger className="h-8 text-xs" data-testid={`designer-${id}-select`}><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={String(o)} style={id === "font" ? { fontFamily: `'${o}'` } : undefined}>{o}</SelectItem>)}</SelectContent></Select></div>
);

const Toggle = ({ label, checked, onChange, id }) => (
  <label className="flex items-center gap-2 text-xs"><Switch checked={!!checked} onCheckedChange={onChange} data-testid={`designer-${id}-switch`} />{label}</label>
);

const Box = ({ el, set }) => (
  <div className="grid grid-cols-4 gap-2">
    <Num label="X" value={el.x} onChange={(x) => set({ x })} id="x" /><Num label="Y" value={el.y} onChange={(y) => set({ y })} id="y" />
    <Num label="Width" value={el.w} onChange={(w) => set({ w })} min={10} id="w" /><Num label="Height" value={el.h} onChange={(h) => set({ h })} min={8} id="h" />
  </div>
);

export function ElementInspector({ k, el, set }) {
  if (k === "photo") return (
    <div className="space-y-3"><Box el={el} set={set} />
      <div className="grid grid-cols-3 gap-2"><Pick label="Shape" value={el.shape || "rect"} options={["rect", "arch", "circle", "hex", "diamond", "shield", "slant"]} onChange={(shape) => set({ shape })} id="photo-shape" />
        <Num label="Corner radius" value={el.radius} onChange={(radius) => set({ radius })} id="photo-radius" />
        <Num label="Fade bottom (0–1)" value={el.fade} step={0.05} min={0} max={1} onChange={(fade) => set({ fade })} id="photo-fade" />
        <Num label="Border width" value={el.border_width} onChange={(border_width) => set({ border_width })} min={0} id="photo-border" />
        <Color label="Border colour" value={el.border_color} onChange={(border_color) => set({ border_color })} id="photo-border" /></div>
      <div className="flex flex-wrap gap-4"><Toggle label="Border uses accent" checked={el.border_accent} onChange={(border_accent) => set({ border_accent })} id="photo-border-accent" />
        <Toggle label="Accent glow" checked={el.glow} onChange={(glow) => set({ glow })} id="photo-glow" /></div></div>
  );
  if (k === "stats") return (
    <div className="space-y-3"><Box el={el} set={set} />
      <div className="grid grid-cols-2 gap-2"><Pick label="Font" value={el.font} options={FONTS} onChange={(font) => set({ font })} id="font" />
        <Pick label="Columns" value={el.cols} options={[1, 2, 3, 4, 6]} onChange={(v) => set({ cols: Number(v) })} id="cols" />
        <Num label="Value size" value={el.size} onChange={(size) => set({ size })} min={6} id="stat-size" />
        <Num label="Label size" value={el.label_size} onChange={(label_size) => set({ label_size })} min={5} id="label-size" />
        <Color label="Value colour" value={el.value_color} onChange={(value_color) => set({ value_color })} id="value" />
        <Color label="Label colour" value={el.label_color} onChange={(label_color) => set({ label_color })} id="label" />
        <Color label="Box colour" value={el.box_color} onChange={(box_color) => set({ box_color })} id="box" />
        <Num label="Box opacity (0–1)" value={el.box_alpha} step={0.05} min={0} max={1} onChange={(box_alpha) => set({ box_alpha })} id="box-alpha" />
        <Pick label="Style" value={el.style || "boxes"} options={["boxes", "pills", "plain"]} onChange={(style) => set({ style })} id="stat-style" />
        <Pick label="Align" value={el.align || "left"} options={["left", "center", "right"]} onChange={(align) => set({ align })} id="stat-align" /></div>
      <div className="flex flex-wrap gap-4"><Toggle label="Accent bar on each stat" checked={el.accent_bar} onChange={(accent_bar) => set({ accent_bar })} id="accent-bar" />
        <Toggle label="Values use accent" checked={el.value_accent} onChange={(value_accent) => set({ value_accent })} id="value-accent" />
        <Toggle label="Frosted glass boxes" checked={el.blur} onChange={(blur) => set({ blur })} id="stat-blur" /></div></div>
  );
  return (
    <div className="space-y-3"><Box el={el} set={set} />
      <div className="grid grid-cols-2 gap-2"><Pick label="Font" value={el.font} options={FONTS} onChange={(font) => set({ font })} id="font" />
        <Pick label="Weight" value={el.weight} options={WEIGHTS} onChange={(v) => set({ weight: Number(v) })} id="weight" />
        <Num label="Font size" value={el.size} onChange={(size) => set({ size })} min={5} id="size" />
        <Num label="Letter spacing" value={el.letter} step={0.5} onChange={(letter) => set({ letter })} id="letter" />
        <Color label="Text colour" value={el.color} onChange={(color) => set({ color })} id="text" />
        <Pick label="Align" value={el.align} options={["left", "center", "right"]} onChange={(align) => set({ align })} id="align" />
        <Color label="Background" value={el.bg_color} onChange={(bg_color) => set({ bg_color })} id="el-bg" />
        <Num label="Background opacity (0–1)" value={el.bg_alpha} step={0.05} min={0} max={1} onChange={(bg_alpha) => set({ bg_alpha })} id="el-bg-alpha" />
        <Num label="Corner radius" value={el.radius} onChange={(radius) => set({ radius })} min={0} id="el-radius" />
        <Num label="Opacity (0–1)" value={el.opacity ?? 1} step={0.05} min={0} max={1} onChange={(opacity) => set({ opacity })} id="el-opacity" />
        <Color label="Glow / shadow colour" value={el.shadow_color} onChange={(shadow_color) => set({ shadow_color })} id="el-shadow" /></div>
      <div className="flex flex-wrap gap-4"><Toggle label="Use card accent colour" checked={el.use_accent} onChange={(use_accent) => set({ use_accent })} id="use-accent" />
        <Toggle label="UPPERCASE" checked={el.upper} onChange={(upper) => set({ upper })} id="upper" />
        <Toggle label="Italic" checked={el.italic} onChange={(italic) => set({ italic })} id="italic" />
        <Toggle label="Glow / shadow" checked={el.shadow} onChange={(shadow) => set({ shadow })} id="shadow" />
        <Toggle label="Glow uses accent" checked={el.shadow_accent} onChange={(shadow_accent) => set({ shadow_accent })} id="shadow-accent" />
        <Toggle label="Outline text" checked={el.outline} onChange={(outline) => set({ outline })} id="outline" />
        <Toggle label="Background uses accent" checked={el.bg_accent} onChange={(bg_accent) => set({ bg_accent })} id="bg-accent" />
        <Toggle label="Behind photo" checked={el.behind} onChange={(behind) => set({ behind })} id="behind" /></div></div>
  );
}

export function CanvasInspector({ g, set }) {
  const api = useApi();
  const ref = useRef(null);
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("Image must be 5 MB or smaller.");
    const fd = new FormData();
    fd.append("file", f);
    try { set({ bg_image: (await api("post", "/admin/uploads/image", fd)).url }); toast.success("Background uploaded"); }
    catch (err) { toast.error(errMsg(err, "Upload failed")); }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} data-testid="designer-bg-file-input" />
        <Button size="sm" variant="outline" onClick={() => ref.current.click()} data-testid="designer-bg-upload-button">{g.bg_image ? "Replace background image" : "Upload background image"}</Button>
        {g.bg_image && <Button size="sm" variant="ghost" onClick={() => set({ bg_image: "" })} data-testid="designer-bg-remove-button">Remove</Button>}
        <span className="text-[11px] text-muted-foreground">Best at 1080×1512 (5:7).</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Color label="Background colour" value={g.bg_color} onChange={(bg_color) => set({ bg_color })} id="bg" />
        <Num label="Darken background (0–0.9)" value={g.overlay} step={0.05} min={0} max={0.9} onChange={(overlay) => set({ overlay })} id="overlay" />
        <Num label="Card corner radius" value={g.radius} min={0} onChange={(radius) => set({ radius })} id="card-radius" />
        <Num label="Card border width" value={g.border_width} min={0} onChange={(border_width) => set({ border_width })} id="card-border" />
        <Color label="Border colour" value={g.border_color} onChange={(border_color) => set({ border_color })} id="card-border" />
        <Num label="Bottom shade (0–1)" value={g.grad} step={0.05} min={0} max={1} onChange={(grad) => set({ grad })} id="grad" />
        <Color label="Bottom shade colour" value={g.grad_color} onChange={(grad_color) => set({ grad_color })} id="grad" />
      </div>
      <div className="flex flex-wrap gap-4"><Toggle label="Border uses card accent colour" checked={g.border_accent} onChange={(border_accent) => set({ border_accent })} id="border-accent" />
        <Toggle label="Inner foil frame" checked={g.frame} onChange={(frame) => set({ frame })} id="frame" /></div>
    </div>
  );
}
