import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, RotateCcw, CheckCircle2, AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApi, errMsg } from "@/lib/api";
import { Section } from "./SettingsExtra";

const CopyRow = ({ label, value, id }) => (
  <div className="space-y-1 min-w-0"><Label className="text-xs">{label}</Label>
    <div className="flex gap-2"><Input readOnly value={value} className="font-mono text-xs" data-testid={`google-${id}`} />
      <Button type="button" size="icon" variant="outline" aria-label={`Copy ${label}`} data-testid={`google-${id}-copy`}
        onClick={() => navigator.clipboard.writeText(value).then(() => toast.success("Copied"))}><Copy className="w-4 h-4" /></Button></div></div>
);

const Step = ({ n, title, children }) => (
  <li className="flex gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-amber-500 text-slate-950 text-xs font-bold grid place-items-center">{n}</span>
    <div className="min-w-0 text-sm"><p className="font-semibold">{title}</p><div className="text-xs text-muted-foreground mt-1 space-y-1">{children}</div></div></li>
);

function Guide({ origin }) {
  return (
    <ol className="space-y-4 rounded-xl bg-muted/40 p-4" data-testid="google-setup-guide">
      <Step n={1} title="Create a Google Cloud project">
        <p>Open <a className="text-amber-500 underline inline-flex items-center gap-0.5" href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noreferrer">console.cloud.google.com<ExternalLink className="w-3 h-3" /></a>, sign in with the Google account that should own sign-in, name the project <b>FlexoCards</b> and click <b>Create</b>. Make sure it is selected in the top bar.</p>
      </Step>
      <Step n={2} title="Fill in the app ownership details (OAuth consent screen / Branding)">
        <p>Go to <b>APIs &amp; Services → OAuth consent screen</b> (newer screens call it <b>Google Auth Platform → Branding</b>) and click <b>Get started</b>.</p>
        <p>• <b>App name:</b> FlexoCards &nbsp;• <b>User support email:</b> your email (e.g. support@cricanalyze.in)</p>
        <p>• <b>Audience:</b> External &nbsp;• <b>Contact information:</b> your email, then agree and <b>Create</b>.</p>
        <p>• Under <b>Branding</b> add (optional but recommended): app logo, <b>Application home page</b> {origin}, <b>Privacy policy</b> {origin}/privacy, <b>Terms of service</b> {origin}/terms, and <b>Authorised domains</b>: your main domain (e.g. cricanalyze.in).</p>
        <p>• <b>Data access / Scopes:</b> only <code>openid</code>, <code>email</code> and <code>profile</code> are used — these need no Google review.</p>
        <p>• <b>Audience → Publish app</b> so every Google user can sign in (while in "Testing", only test users you list can).</p>
      </Step>
      <Step n={3} title="Create the OAuth Client ID">
        <p>Go to <b>Clients</b> (or <b>Credentials → Create credentials → OAuth client ID</b>). Application type: <b>Web application</b>, name: FlexoCards Web.</p>
        <p>Paste the two values below into <b>Authorised JavaScript origins</b> and <b>Authorised redirect URIs</b>. Add the same pair for every domain the site runs on (preview and your live domain).</p>
      </Step>
      <Step n={4} title="Copy the Client ID and Client secret here">
        <p>Google shows them right after you click <b>Create</b> (you can download the JSON too). Paste both below and save — the <b>Continue with Google</b> button appears on the sign-in page straight away.</p>
      </Step>
    </ol>
  );
}

function ModeControls({ data, onSaved }) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const setMode = async (patch) => {
    setBusy(true);
    try { onSaved(await api("put", "/admin/settings/google-mode", { enabled: data.enabled, provider: data.provider, ...patch })); toast.success("Google sign-in updated"); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const Opt = ({ id, title, sub }) => (
    <button type="button" disabled={busy} onClick={() => setMode({ provider: id })} data-testid={`google-provider-${id}`}
      className={`text-left rounded-xl border p-3 transition-colors ${data.provider === id ? "border-amber-500 bg-amber-500/10" : "border-border hover:bg-accent"}`}>
      <p className="text-sm font-semibold flex items-center gap-2"><span className={`w-3 h-3 rounded-full border-2 ${data.provider === id ? "border-amber-500 bg-amber-500" : "border-muted-foreground"}`} />{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </button>
  );
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 text-sm font-semibold"><Switch checked={data.enabled} disabled={busy} onCheckedChange={(enabled) => setMode({ enabled })} data-testid="google-enabled-switch" />
        Show "Continue with Google" on the sign-in page</label>
      {data.enabled && <div className="grid sm:grid-cols-2 gap-3">
        <Opt id="emergent" title="Emergent managed (default)" sub="Works instantly, nothing to set up. Google's screen shows Emergent as the app." />
        <Opt id="own" title="My own Google keys" sub={data.has_keys ? "Google's screen shows FlexoCards. Uses the keys saved below." : "Google's screen shows FlexoCards. Save your keys below first."} />
      </div>}
    </div>
  );
}

export function GoogleSignInSettings({ data, onSaved, onReset }) {
  const api = useApi();
  const origin = window.location.origin;
  const [f, setF] = useState({ client_id: data.client_id || "", client_secret: "" });
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { onSaved(await api("put", "/admin/settings/google", f)); setF((s) => ({ ...s, client_secret: "" })); toast.success("Your Google keys are saved and in use"); }
    catch (err) { toast.error(errMsg(err, "Check the Client ID — it ends with .apps.googleusercontent.com")); } finally { setBusy(false); }
  };
  const clearKeys = async () => {
    try { onSaved(await api("delete", "/admin/settings/google/keys")); setF({ client_id: "", client_secret: "" }); toast.success("Keys removed"); } catch (err) { toast.error(errMsg(err)); }
  };
  const status = !data.enabled ? "Off. Only email-code sign-in is shown." : data.provider === "emergent" ? "On — using Emergent managed Google sign-in." : data.connected ? `On — using your own Google keys (secret ${data.client_secret_hint}).` : "Your own keys are selected but not saved yet.";
  return (
    <Section icon={KeyRound} title="Google sign-in" testId="settings-google"
      sub="Let people sign in with their Google account. Email-code sign-in always stays on.">
      <p className={`text-sm flex items-center gap-2 ${data.connected ? "text-emerald-500" : "text-amber-500"}`} data-testid="google-status">
        {data.connected ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{status}</p>
      <ModeControls data={data} onSaved={onSaved} />
      {data.enabled && data.provider === "own" && <>
      <div className="grid sm:grid-cols-2 gap-4">
        <CopyRow label="Authorised JavaScript origin" value={origin} id="origin" />
        <CopyRow label="Authorised redirect URI" value={`${origin}/api/auth/google/callback`} id="redirect-uri" />
      </div>
      <Guide origin={origin} />
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 min-w-0"><Label>Client ID</Label><Input required value={f.client_id} onChange={(e) => setF({ ...f, client_id: e.target.value })} placeholder="1234567890-abc123.apps.googleusercontent.com" className="font-mono text-xs" data-testid="google-client-id-input" /></div>
        <div className="space-y-1.5 min-w-0"><Label>Client secret</Label><Input type="password" autoComplete="new-password" value={f.client_secret} onChange={(e) => setF({ ...f, client_secret: e.target.value })} placeholder={data.connected ? "Leave empty to keep the saved secret" : "GOCSPX-…"} className="font-mono text-xs" data-testid="google-client-secret-input" /></div>
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <Button type="submit" disabled={busy} data-testid="google-save-button">{busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Save Google keys</Button>
          {data.saved_in_admin && <Button type="button" variant="ghost" onClick={clearKeys} data-testid="google-disconnect-button"><RotateCcw className="w-4 h-4 mr-1" />Remove saved keys</Button>}
        </div>
      </form>
      </>}
    </Section>
  );
}
