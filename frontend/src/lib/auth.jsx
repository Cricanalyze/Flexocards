import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthCtx = createContext({ isLoaded: false, isSignedIn: false, user: null });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const refresh = useCallback(async () => {
    try { setSession((await axios.get(`${API}/auth/session`, { withCredentials: true })).data); }
    catch { setSession({ signed_in: false }); }
  }, []);
  const signOut = useCallback(async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); } finally { setSession({ signed_in: false }); }
  }, []);
  useEffect(() => {
    // Emergent Google callback (#session_id=) creates the session first; AuthHashGate refreshes afterwards.
    if (window.location.hash.includes("session_id=")) return;
    refresh();
  }, [refresh]);
  const value = { isLoaded: !!session, isSignedIn: !!session?.signed_in, user: session?.signed_in ? session : null, refresh, signOut, getToken: async () => null };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

export function Show({ when, children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return (when === "signed-in") === isSignedIn ? children : null;
}
