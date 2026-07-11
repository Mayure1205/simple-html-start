export function Topbar({ section, onNav }: { section: string; onNav: (id: string) => void }) {
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
        <button onClick={() => onNav("account")} className="btn-ghost">Account</button>
      </div>
    </header>
  );
}
