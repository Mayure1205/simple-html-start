import { motion } from "framer-motion";

type Item = { id: string; label: string; hint: string; icon: JSX.Element };

const items: Item[] = [
  { id: "overview", label: "Overview", hint: "System pulse",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/></svg> },
  { id: "ingestion", label: "Ingestion", hint: "Range jobs",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg> },
  { id: "analytics", label: "Analytics", hint: "Network + wallet",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4v16h16"/><rect x="7.5" y="11" width="2.6" height="6" rx="0.6"/><rect x="12.5" y="7" width="2.6" height="10" rx="0.6"/><rect x="17.5" y="13" width="2.6" height="4" rx="0.6"/></svg> },
  { id: "wallets", label: "Wallets", hint: "Watchlist",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10.5h18"/></svg> },
  { id: "failures", label: "Failures", hint: "Retry queue",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3.5l9 16H3l9-16z"/><line x1="12" y1="10" x2="12" y2="14"/></svg> },
  { id: "wallets", label: "Watchlist", hint: "Whale tracking",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7s-7-2-10-7z"/><circle cx="12" cy="12" r="3"/></svg> },

];

export function Sidebar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/5 bg-ink-900/40 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="relative">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-core to-indigo-glow shadow-glow flex items-center justify-center font-display font-bold text-white">CS</div>
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-ink-900 animate-pulseGlow" />
        </div>
        <div>
          <h1 className="font-display text-[15px] font-semibold leading-none text-white">ChainSight</h1>
          <p className="mt-1 text-[11px] text-mist-600 tracking-wide">Warehouse Ops Console</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onSelect(it.id)}
              className={`relative group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition
                ${isActive ? "bg-white/[0.06] text-white" : "text-mist-400 hover:text-white hover:bg-white/[0.03]"}`}
            >
              {isActive && (
                <motion.span
                  layoutId="side-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r bg-indigo-glow shadow-glow"
                />
              )}
              <span className={`${isActive ? "text-indigo-glow" : "text-mist-600 group-hover:text-mist-200"}`}>{it.icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{it.label}</span>
                <span className="block text-[11px] text-mist-600">{it.hint}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/5 px-5 py-4 text-[11px] text-mist-600">
        <div className="flex items-center justify-between">
          <span className="font-mono">v0.11.0</span>
          <span className="chip"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> live</span>
        </div>
      </div>
    </aside>
  );
}
