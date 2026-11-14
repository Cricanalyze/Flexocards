import { useRef, useState } from "react";
import { Lock, Loader2, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useApi, errMsg, newRequestId } from "@/lib/api";
import { useAppData } from "@/context/AppData";

const STYLES = [["illustrated", "Card art"], ["comic", "Comic"], ["painted", "Painted"], ["neon", "Neon glow"], ["vector", "Poster"], ["sketch", "Sketch"]];
const upgradeToast = (msg) => toast.error(msg, { action: { label: "See plans", onClick: () => window.location.assign("/pricing") } });

export function AiPhotoSection({ photo, setPhoto, ent }) {
  const api = useApi();
  const { refreshMe, isSignedIn } = useAppData();
  const [style, setStyle] = useState("illustrated");
  const [busy, setBusy] = useState(false);
  const reqId = useRef("");
  const limit = ent?.ai_photo_limit || 0;
  const run = async () => {
    if (!isSignedIn || !limit) return upgradeToast("AI photo art is included in Basic, Pro and Team.");
    setBusy(true);
    reqId.current = reqId.current || newRequestId();
    try {
      const r = await api("post", "/tools/ai-photo", { request_id: reqId.current, image: photo.original || photo.src, style });
      setPhoto({ ...photo, original: photo.original || photo.src, src: r.image, cutout: "", useCutout: false, zoom: 1, x: 0, y: 0, rotate: 0 });
      reqId.current = "";
      toast.success(`Photo redrawn as AI art. ${r.remaining} left this month.`);
      refreshMe();
    } catch (e) {
      reqId.current = "";
      if (e?.response?.status === 402) upgradeToast(errMsg(e)); else toast.error(errMsg(e, "AI redraw failed. No credit was used."));
    } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3 border-t border-border pt-5" data-testid="ai-photo-section">
      <div>
        <p className="font-semibold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />AI photo art {!limit && <span className="text-[10px] font-bold uppercase bg-amber-500 text-slate-950 px-1.5 rounded">Basic+</span>}</p>
        <p className="text-xs text-muted-foreground">Turns your photo into original sports artwork — logos and brand marks are removed. Your photo is sent securely to our AI for this step only. {limit ? `${ent.ai_photos_remaining} of ${limit} redraws left this month.` : ""}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STYLES.map(([k, l]) => (
          <button key={k} onClick={() => setStyle(k)} data-testid={`ai-style-${k}`}
            className={`h-8 px-3 rounded-full border text-xs font-semibold transition-colors ${style === k ? "border-amber-500 bg-amber-500/10" : "border-border hover:border-amber-500/50"}`}>{l}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={run} disabled={busy} className="rounded-full font-bold" data-testid="ai-photo-generate-button">
          {busy ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Drawing… (about 20s)</> : <>{!limit && <Lock className="w-3 h-3 mr-1" />}<Sparkles className="w-4 h-4 mr-1" />Redraw with AI</>}</Button>
        {photo.original && <Button variant="ghost" className="rounded-full" onClick={() => setPhoto({ ...photo, src: photo.original, original: "", cutout: "", useCutout: false })} data-testid="ai-photo-restore-button"><Undo2 className="w-4 h-4 mr-1" />Use my original photo</Button>}
      </div>
    </div>
  );
}
