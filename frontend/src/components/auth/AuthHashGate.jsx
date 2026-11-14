import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { API } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function AuthCallback({ hash }) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const sid = new URLSearchParams(hash.slice(1)).get("session_id");
    axios.post(`${API}/auth/emergent/session`, { session_id: sid }, { withCredentials: true })
      .then(async () => { await refresh(); toast.success("You're signed in"); navigate(pathname + search, { replace: true }); })
      .catch((e) => { toast.error(e?.response?.data?.detail || "Google sign-in didn't work. Please try again."); refresh(); navigate("/sign-in", { replace: true }); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="min-h-screen grid place-items-center" data-testid="auth-callback"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
}

// Emergent Google sign-in lands on `<page>#session_id=...`; read the hash from useLocation (reactive) before normal routes.
export function AuthHashGate({ children }) {
  const { hash } = useLocation();
  if (hash?.includes("session_id=")) return <AuthCallback hash={hash} />;
  return children;
}
