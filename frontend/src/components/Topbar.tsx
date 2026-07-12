import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, auth } from "@/lib/api";

type Props = {
  section: string;
  user: any;
  onAuthed: (u: any) => void;
  onSignOut: () => void;
};

export function Topbar({ section, user, onAuthed, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fn = mode === "login" ? api.login : api.register;
      const r = await fn(email, password);
      const token = r?.accessToken || r?.token;
      if (token) auth.set(token);
      const u = r?.user || (await api.me());
      onAuthed(u);
      setOpen(false); setEmail(""); setPassword("");
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl px-6 py-3">
      <div className="flex items-center gap-2 text-xs text-mist-600">
        <span>ChainSight</span>
        <span className="text-mist-600">/</span>
        <span className="text-white font-medium capitalize">{section}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-mist-400">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <span>Jump to…</span>
          <span className="kbd ml-4">⌘K</span>
        </div>

        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-2 py-1.5 text-xs text-mist-200"
          >
            <span className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-core to-indigo-glow flex items-center justify-center font-display font-bold text-white text-[11px]">
              {user?.email?.[0]?.toUpperCase() || "?"}
            </span>
            <span className="hidden sm:inline max-w-[140px] truncate">{user?.email || "Sign in"}</span>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-ink-900 shadow-2xl overflow-hidden"
              >
                {user ? (
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-mist-600">Signed in</div>
                      <div className="mt-1 font-mono text-sm text-white truncate">{user.email}</div>
                    </div>
                    <button onClick={() => { onSignOut(); setOpen(false); }} className="btn-ghost w-full justify-center">Sign out</button>
                  </div>
                ) : (
                  <form onSubmit={submit} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">{mode === "login" ? "Sign in" : "Create account"}</h4>
                      <button type="button" className="text-[11px] text-mist-400 hover:text-white" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                        {mode === "login" ? "Register →" : "Have an account?"}
                      </button>
                    </div>
                    <input className="input" type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
                    <input className="input" type="password" required minLength={8} placeholder="password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)}/>
                    {err && <div className="text-[11px] rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-rose-200">{err}</div>}
                    <button className="btn-primary w-full justify-center" disabled={busy}>{busy ? "…" : mode === "login" ? "Sign in" : "Create account"}</button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
