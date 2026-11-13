import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Megaphone, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi, errMsg } from "@/lib/api";
import { Section } from "./SettingsExtra";

const BLANK = { text: "", link_url: "", link_label: "", tone: "amber", active: true, order: 100 };
const TONE_DOT = { amber: "bg-amber-400", cyan: "bg-cyan-400", green: "bg-emerald-500", red: "bg-rose-600" };

function Form({ init, onSubmit, submitLabel, testid }) {
  const [f, setF] = useState(init);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, order: Number(f.order) || 100 }, () => setF(BLANK)); }} className="grid sm:grid-cols-6 gap-3" data-testid={testid}>
      <div className="sm:col-span-6 space-y-1"><Label>Message</Label><Input required maxLength={180} value={f.text} onChange={set("text")} placeholder="New: Kabaddi Pro templates are live!" data-testid={`${testid}-text`} /></div>
      <div className="sm:col-span-2 space-y-1"><Label>Link (optional)</Label><Input value={f.link_url} onChange={set("link_url")} placeholder="/explore or https://…" data-testid={`${testid}-link-url`} /></div>
      <div className="sm:col-span-2 space-y-1"><Label>Link text</Label><Input maxLength={30} value={f.link_label} onChange={set("link_label")} placeholder="Try it" data-testid={`${testid}-link-label`} /></div>
      <div className="space-y-1"><Label>Colour</Label>
        <Select value={f.tone} onValueChange={(tone) => setF({ ...f, tone })}><SelectTrigger data-testid={`${testid}-tone`}><SelectValue /></SelectTrigger>
          <SelectContent>{Object.keys(TONE_DOT).map((t) => <SelectItem key={t} value={t}><span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${TONE_DOT[t]}`} />{t}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label>Order</Label><Input type="number" value={f.order} onChange={set("order")} data-testid={`${testid}-order`} /></div>
      <div className="sm:col-span-6 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.active} onCheckedChange={(active) => setF({ ...f, active })} data-testid={`${testid}-active`} />Show on the website</label>
        <Button type="submit" data-testid={`${testid}-submit`}>{submitLabel}</Button>
      </div>
    </form>
  );
}

export function AnnouncementsSettings() {
  const api = useApi();
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState("");
  const load = () => api("get", "/admin/announcements").then(setList).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (fn, msg) => { try { await fn(); toast.success(msg); setEditing(""); load(); } catch (e) { toast.error(errMsg(e, "Check the message and link")); } };
  return (
    <Section icon={Megaphone} title="Announcement bar" testId="settings-announcements"
      sub="Short lines shown at the very top of every public page to announce new things. Several active lines rotate every 6 seconds; visitors can close them.">
      <Form init={BLANK} submitLabel={<><Plus className="w-4 h-4 mr-1" />Add announcement</>} testid="announcement-new"
        onSubmit={(f, reset) => run(async () => { await api("post", "/admin/announcements", f); reset(); }, "Announcement added")} />
      <div className="divide-y divide-border rounded-xl border border-border" data-testid="announcement-list">
        {list.length === 0 && <p className="p-4 text-sm text-muted-foreground">No announcements yet.</p>}
        {list.map((a) => (
          <div key={a.id} className="p-4 space-y-3" data-testid={`announcement-row-${a.id}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${TONE_DOT[a.tone]}`} />
              <p className="flex-1 min-w-0 text-sm font-medium">{a.text}{a.link_url && <span className="text-muted-foreground"> · {a.link_label || "Learn more"} → {a.link_url}</span>}</p>
              <label className="flex items-center gap-2 text-xs"><Switch checked={a.active} onCheckedChange={(active) => run(() => api("put", `/admin/announcements/${a.id}`, { ...a, active }), active ? "Now showing" : "Hidden")} data-testid={`announcement-toggle-${a.id}`} />{a.active ? "Live" : "Hidden"}</label>
              <Button size="sm" variant="outline" onClick={() => setEditing(editing === a.id ? "" : a.id)} data-testid={`announcement-edit-${a.id}`}>{editing === a.id ? "Close" : "Edit"}</Button>
              <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => window.confirm("Delete this announcement?") && run(() => api("delete", `/admin/announcements/${a.id}`), "Deleted")} data-testid={`announcement-delete-${a.id}`}><Trash2 className="w-4 h-4" /></Button>
            </div>
            {editing === a.id && <Form init={a} submitLabel="Save changes" testid={`announcement-form-${a.id}`} onSubmit={(f) => run(() => api("put", `/admin/announcements/${a.id}`, f), "Saved")} />}
          </div>
        ))}
      </div>
    </Section>
  );
}
