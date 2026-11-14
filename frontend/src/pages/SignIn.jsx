import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth";
import { API, errMsg } from "@/lib/api";

const ERRORS = { google_cancelled: "Google sign-in was cancelled.", google_state: "Google sign-in timed out. Please try again.",
  google_failed: "Google sign-in didn't work. Please try again.", google_unverified: "Your Google email isn't verified." };

const toPath = (u) => { try { const x = new URL(u, window.location.origin); return x.origin === window.location.origin ? x.pathname + x.search : "/"; } catch { return "/"; } };

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
);

export default function SignInPage({ mode = "sign-in" }) {
  const { isSignedIn, refresh } = useAuth();
  const [params] = useSearchParams();
  const next = toPath(params.get("redirect_url") || params.get("next") || "/dashboard");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [google, setGoogle] = useState(false);
  const [minutes, setMinutes] = useState(10);

  useEffect(() => { axios.get(`${API}/auth/config`).then((r) => { setGoogle(r.data.google); setMinutes(r.data.code_minutes); }).catch(() => {}); }, []);
  useEffect(() => { const e = params.get("error"); if (e) toast.error(ERRORS[e] || "Sign-in failed. Please try again."); }, [params]);
  if (isSignedIn) return <Navigate to={next} replace />;

  const send = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try { await axios.post(`${API}/auth/otp/request`, { email: email.trim() }, { withCredentials: true }); setStep("code"); setCode(""); toast.success(`We sent a 6-digit code to ${email.trim()}`); }
    catch (err) { toast.error(errMsg(err, "Could not send the code.")); } finally { setBusy(false); }
  };
  const verify = async (value = code) => {
    if (value.length !== 6) return;
    setBusy(true);
    try { await axios.post(`${API}/auth/otp/verify`, { email: email.trim(), code: value }, { withCredentials: true }); await refresh(); toast.success("You're signed in"); }
    catch (err) { toast.error(errMsg(err, "That code didn't work.")); setCode(""); } finally { setBusy(false); }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl" data-testid="sign-in-card">
      <img src="/logo-mark.png" alt="" className="w-12 h-12 mb-5" />
      <h1 className="font-display font-black uppercase text-3xl sm:text-4xl leading-none">{mode === "sign-up" ? "Create your account" : "Sign in"}</h1>
      <p className="text-sm text-muted-foreground mt-2">Continue to FlexoCards. No password needed.</p>
      {step === "email" ? (
        <div className="mt-7 space-y-4">
          {google && (<>
            <Button asChild variant="outline" className="w-full h-12 rounded-full font-semibold" data-testid="google-sign-in-button">
              <a href={google === "own" ? `${API}/auth/google/start?next=${encodeURIComponent(next)}`
                // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
                : `https://auth.emergentagent.com/?redirect=${encodeURIComponent(window.location.origin + next)}`}><GoogleIcon /><span className="ml-2">Continue with Google</span></a></Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          </>)}
          <form onSubmit={send} className="space-y-3">
            <Input type="email" required autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-full px-5" data-testid="sign-in-email-input" />
            <Button type="submit" disabled={busy} className="w-full h-12 rounded-full font-bold hover:bg-amber-400 hover:text-slate-950" data-testid="sign-in-send-code-button">
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}Email me a code</Button>
          </form>
          <p className="text-[11px] text-muted-foreground">New here? Entering your email creates your free account.</p>
        </div>
      ) : (
        <div className="mt-7 space-y-5" data-testid="sign-in-code-step">
          <p className="text-sm">Enter the 6-digit code sent to <b data-testid="sign-in-code-email">{email}</b>. It works for {minutes} minutes.</p>
          <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); if (v.length === 6) verify(v); }} disabled={busy} data-testid="sign-in-code-input">
            <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl" />)}</InputOTPGroup>
          </InputOTP>
          <Button onClick={() => verify()} disabled={busy || code.length !== 6} className="w-full h-12 rounded-full font-bold" data-testid="sign-in-verify-button">
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Sign in</Button>
          <div className="flex justify-between text-xs">
            <button onClick={() => setStep("email")} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground" data-testid="sign-in-change-email"><ArrowLeft className="w-3 h-3" />Change email</button>
            <button onClick={send} disabled={busy} className="text-amber-500 hover:underline" data-testid="sign-in-resend-code">Send a new code</button>
          </div>
        </div>
      )}
    </div>
  );
}
