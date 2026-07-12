import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, auth, fmtInt, shortHash } from "@/lib/api";
import { StatCard } from "./StatCard";
import { WalletDetail } from "./WalletDetail";


function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fn()
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => { if (alive) setError(e.message || "Request failed"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, loading, reload: () => setTick((t) => t + 1) };
}

/* ------------------------ Overview ------------------------ */
export function OverviewPanel() {
  const status = useAsync(() => api.ingestionStatus());
  const daily = useAsync(() => api.networkDaily(14));

  const s = status.data || {};
  const dailyPoints = (daily.data?.days || []).map((d: any) => ({
    day: (d.day || "").slice(5),
    tx: Number(d.transactionCount || 0),
    blocks: Number(d.blockCount || 0),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Latest Block" value={fmtInt(s.latestBlock)} hint="Persisted head" accent="indigo" />
        <StatCard label="Total Blocks" value={fmtInt(s.totalBlocks)} hint="Warehouse rows" accent="emerald" />
        <StatCard label="Active Jobs" value={fmtInt(s.activeJobs?.length || 0)} hint="In-flight ranges" accent="amber" />
        <StatCard label="Failed Blocks" value={fmtInt(s.failedBlockCount)} hint="Retry queue depth" accent="rose" />
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3 className="text-sm font-semibold text-white">Network throughput</h3>
            <p className="text-xs text-mist-600">Daily transactions and blocks ingested</p>
          </div>
          <span className="chip">Last 14d</span>
        </div>
        <div className="p-4 h-72">
          {daily.loading ? <Skeleton /> : dailyPoints.length === 0 ? <Empty msg="No daily analytics yet — ingest a range first." /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyPoints} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTx" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.55}/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gBl" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.45}/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#5b6394", fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: "#5b6394", fontSize: 11 }} axisLine={false} tickLine={false} width={54}/>
                <Tooltip
                  contentStyle={{ background: "#0f0f24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "#c7ccf5" }}
                />
                <Area type="monotone" dataKey="tx" stroke="#8b5cf6" strokeWidth={2} fill="url(#gTx)" />
                <Area type="monotone" dataKey="blocks" stroke="#4f46e5" strokeWidth={2} fill="url(#gBl)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel lg:col-span-2">
          <div className="panel-heading">
            <h3 className="text-sm font-semibold text-white">Pipeline stages</h3>
            <span className="chip">real-time</span>
          </div>
          <PipelineDiagram active={(s.activeJobs?.length || 0) > 0} />
        </div>
        <div className="panel">
          <div className="panel-heading">
            <h3 className="text-sm font-semibold text-white">Active jobs</h3>
            <span className="text-xs text-mist-600">{s.activeJobs?.length || 0}</span>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {(s.activeJobs || []).length === 0 ? (
              <div className="text-xs text-mist-600">No jobs running.</div>
            ) : (s.activeJobs || []).map((j: any) => (
              <div key={j.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-mist-200">#{j.id}</span>
                  <span className="chip">{j.status}</span>
                </div>
                <div className="mt-1 text-[11px] text-mist-600">
                  {fmtInt(j.fromBlock)} → {fmtInt(j.toBlock)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineDiagram({ active }: { active: boolean }) {
  const stages = ["RPC", "Extract", "Transform", "Batch write", "Checkpoint"];
  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3">
        {stages.map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-3">
            <div className="flex-1 flex flex-col items-center">
              <div className={`h-10 w-10 rounded-xl border ${active ? "border-indigo-glow/60 bg-indigo-core/20 shadow-glow" : "border-white/10 bg-white/[0.03]"} flex items-center justify-center font-mono text-[11px] text-mist-200`}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-2 text-[11px] text-mist-400">{s}</div>
            </div>
            {i < stages.length - 1 && (
              <div className="relative h-[2px] flex-1 bg-white/5 overflow-hidden rounded">
                {active && (
                  <motion.div
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-indigo-glow to-transparent"
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------ Ingestion ------------------------ */
export function IngestionPanel() {
  const { data: status, reload } = useAsync(() => api.ingestionStatus());
  const [chainId, setChainId] = useState(1);
  const [fromBlock, setFromBlock] = useState(0);
  const [toBlock, setToBlock] = useState(9);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await api.startRange({ chainId: Number(chainId), fromBlock: Number(fromBlock), toBlock: Number(toBlock) });
      setMsg({ kind: "ok", text: `Job #${r.jobId ?? "?"} started` });
      reload();
    } catch (e: any) { setMsg({ kind: "err", text: e.message }); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="panel lg:col-span-2">
        <div className="panel-heading">
          <h3 className="text-sm font-semibold text-white">Start range ingestion</h3>
          <span className="chip">POST /ingestion/range</span>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Chain ID"><input className="input" type="number" value={chainId} onChange={(e) => setChainId(+e.target.value)} required/></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From block"><input className="input" type="number" value={fromBlock} onChange={(e) => setFromBlock(+e.target.value)} required/></Field>
            <Field label="To block"><input className="input" type="number" value={toBlock} onChange={(e) => setToBlock(+e.target.value)} required/></Field>
          </div>
          <button className="btn-primary w-full justify-center" disabled={busy}>
            {busy ? "Starting…" : "Start ingestion"}
          </button>
          <AnimatePresence>
            {msg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`text-xs rounded-lg border px-3 py-2 ${msg.kind === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-400/30 bg-rose-400/10 text-rose-200"}`}
              >{msg.text}</motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      <div className="panel lg:col-span-3">
        <div className="panel-heading">
          <h3 className="text-sm font-semibold text-white">Warehouse status</h3>
          <button className="btn-ghost" onClick={reload}>Refresh</button>
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-px bg-white/5">
          {[
            ["Latest block", fmtInt(status?.latestBlock)],
            ["Total blocks", fmtInt(status?.totalBlocks)],
            ["Total txns", fmtInt(status?.totalTransactions)],
            ["Active jobs", fmtInt(status?.activeJobs?.length || 0)],
            ["Failed blocks", fmtInt(status?.failedBlockCount)],
            ["Last checkpoint", fmtInt(status?.lastCheckpoint ?? status?.latestBlock)],
          ].map(([k, v]) => (
            <div key={k as string} className="bg-ink-900/60 px-5 py-4">
              <dt className="stat-label">{k}</dt>
              <dd className="mt-1 text-xl font-display font-semibold text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-[11px] uppercase tracking-widest text-mist-600">{label}</div>{children}</label>;
}

/* ------------------------ Analytics ------------------------ */
export function AnalyticsPanel() {
  const [days, setDays] = useState(14);
  const daily = useAsync(() => api.networkDaily(days), [days]);
  const largest = useAsync(() => api.networkLargest(10));
  const [wallet, setWallet] = useState("");
  const [drawerAddr, setDrawerAddr] = useState<string | null>(null);

  function lookup(e: React.FormEvent) {
    e.preventDefault();
    const w = wallet.trim();
    if (w) setDrawerAddr(w);
  }

  const points = (daily.data?.days || []).map((d: any) => ({ day: (d.day || "").slice(5), tx: Number(d.transactionCount || 0) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="panel lg:col-span-3">
          <div className="panel-heading">
            <h3 className="text-sm font-semibold text-white">Daily transactions</h3>
            <div className="flex gap-1">
              {[7, 14, 30].map((d) => (
                <button key={d} onClick={() => setDays(d)} className={`px-2.5 py-1 text-xs rounded-md ${days === d ? "bg-indigo-core text-white" : "text-mist-400 hover:bg-white/5"}`}>{d}d</button>
              ))}
            </div>
          </div>
          <div className="p-4 h-64">
            {daily.loading ? <Skeleton /> : points.length === 0 ? <Empty msg="No data yet." /> : (
              <ResponsiveContainer><AreaChart data={points}>
                <defs><linearGradient id="a1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#5b6394", fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: "#5b6394", fontSize: 11 }} axisLine={false} tickLine={false} width={50}/>
                <Tooltip contentStyle={{ background: "#0f0f24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}/>
                <Area type="monotone" dataKey="tx" stroke="#8b5cf6" strokeWidth={2} fill="url(#a1)" />
              </AreaChart></ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="panel lg:col-span-2">
          <div className="panel-heading"><h3 className="text-sm font-semibold text-white">Largest transactions</h3></div>
          <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
            {(largest.data?.transactions || []).length === 0 && <div className="p-4 text-xs text-mist-600">No transactions yet.</div>}
            {(largest.data?.transactions || []).map((t: any) => (
              <button
                key={t.hash}
                onClick={() => setDrawerAddr(t.fromAddress || t.toAddress)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs hover:bg-white/[0.03] text-left"
              >
                <div>
                  <div className="font-mono text-mist-200">{shortHash(t.hash, 10, 6)}</div>
                  <div className="text-[11px] text-mist-600">block {fmtInt(t.blockNumber)}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white">{fmtInt(t.valueEth ?? t.value)} <span className="text-mist-600 font-normal">ETH</span></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h3 className="text-sm font-semibold text-white">Wallet lookup</h3>
          <span className="text-[11px] text-mist-600">Full analytics drawer — flows, counterparties, distribution</span>
        </div>
        <form onSubmit={lookup} className="p-5 flex flex-col sm:flex-row gap-3">
          <input className="input flex-1 font-mono" placeholder="0x…" value={wallet} onChange={(e) => setWallet(e.target.value)} />
          <button className="btn-primary">Open wallet</button>
        </form>
      </div>

      <WalletDetail address={drawerAddr} onClose={() => setDrawerAddr(null)} />
    </div>
  );
}


function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="stat-label">{label}</div>
      <div className="mt-1 font-display font-semibold text-white truncate">{value}</div>
    </div>
  );
}

/* ------------------------ Wallets (tracked watchlist) ------------------------ */
export function WalletsPanel({ signedIn }: { signedIn: boolean }) {
  const { data, reload, error } = useAsync(() => (signedIn ? api.tracked() : Promise.resolve([])), [signedIn]);
  const [addr, setAddr] = useState("");
  const [label, setLabel] = useState("");
  const [sortBy, setSortBy] = useState<"added" | "address" | "label">("added");
  const [drawerAddr, setDrawerAddr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try { await api.track(addr, label || undefined); setAddr(""); setLabel(""); reload(); } catch (e: any) { alert(e.message); }
  }
  async function remove(id: number, e: React.MouseEvent) { e.stopPropagation(); await api.untrack(id); reload(); }

  const sorted = useMemo(() => {
    const arr = [...(data || [])];
    if (sortBy === "address") arr.sort((a, b) => (a.walletAddress || "").localeCompare(b.walletAddress || ""));
    else if (sortBy === "label") arr.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    return arr;
  }, [data, sortBy]);

  if (!signedIn) {
    return <div className="panel p-10 text-center text-mist-400">Sign in to manage your tracked wallets.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3 className="text-sm font-semibold text-white">Whale Watchlist</h3>
            <p className="text-[11px] text-mist-600 mt-0.5">Tracked wallets are joined against the ingested transactions warehouse — click any row for flows, counterparties, and size distribution.</p>
          </div>
          <span className="chip">powered by ETL pipeline</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="panel lg:col-span-2">
          <div className="panel-heading"><h3 className="text-sm font-semibold text-white">Track a wallet</h3></div>
          <form onSubmit={add} className="p-5 space-y-3">
            <Field label="Address"><input className="input font-mono" required value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="0x…"/></Field>
            <Field label="Label (optional)"><input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Binance hot wallet"/></Field>
            <button className="btn-primary w-full justify-center">Add to watchlist</button>
          </form>
        </div>

        <div className="panel lg:col-span-3">
          <div className="panel-heading">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Watchlist</h3>
              <span className="chip">{data?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-mist-600 mr-1">sort</span>
              {(["added", "address", "label"] as const).map((k) => (
                <button key={k} onClick={() => setSortBy(k)}
                  className={`px-2 py-1 rounded-md ${sortBy === k ? "bg-indigo-core text-white" : "text-mist-400 hover:bg-white/5"}`}>{k}</button>
              ))}
            </div>
          </div>
          {error && <div className="p-5 text-xs text-rose-300">{error}</div>}
          <div className="divide-y divide-white/5">
            {sorted.map((w: any) => (
              <button
                key={w.id}
                onClick={() => setDrawerAddr(w.walletAddress)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/[0.03] group"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm text-white truncate">{w.walletAddress}</div>
                  <div className="text-xs text-mist-600 mt-0.5">{w.label || <span className="italic text-mist-700">unlabeled</span>}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="chip opacity-0 group-hover:opacity-100 transition">Open →</span>
                  <button className="btn-ghost" onClick={(e) => remove(w.id, e)}>Remove</button>
                </div>
              </button>
            ))}
            {(!data || data.length === 0) && (
              <div className="p-8 text-center text-xs text-mist-600">
                No wallets tracked yet. Add a whale address like <code className="text-mist-400">0x28C6c06298d514Db089934071355E5743bf21d60</code> (Binance 14) to see the pipeline in action.
              </div>
            )}
          </div>
        </div>
      </div>

      <WalletDetail address={drawerAddr} onClose={() => setDrawerAddr(null)} />
    </div>
  );
}

}

/* ------------------------ Failures ------------------------ */
export function FailuresPanel() {
  const { data, reload, loading } = useAsync(() => api.failedBlocks());
  const rows = data?.failedBlocks || data || [];

  async function retry(id: number) {
    try { await api.retryFailed(id); reload(); } catch (e: any) { alert(e.message); }
  }

  return (
    <div className="panel">
      <div className="panel-heading">
        <h3 className="text-sm font-semibold text-white">Failed blocks</h3>
        <button className="btn-ghost" onClick={reload}>Refresh</button>
      </div>
      {loading ? <div className="p-8"><Skeleton /></div> : rows.length === 0 ? (
        <Empty msg="Zero failed blocks. Circuit breaker is happy." />
      ) : (
        <div className="divide-y divide-white/5">
          {rows.map((f: any) => (
            <div key={f.id} className="grid grid-cols-6 items-center gap-3 px-5 py-3 text-xs">
              <span className="font-mono text-mist-200">#{f.id}</span>
              <span className="col-span-2 text-mist-200">block {fmtInt(f.blockNumber)}</span>
              <span className="col-span-2 truncate text-mist-600">{f.errorMessage || f.reason || "—"}</span>
              <button className="btn-ghost justify-self-end" onClick={() => retry(f.id)}>Retry</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------ Account ------------------------ */
export function AccountPanel({
  user, onAuthed, onSignOut,
}: { user: any; onAuthed: (u: any) => void; onSignOut: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fn = mode === "login" ? api.login : api.register;
      const r = await fn(email, password);
      const token = r?.accessToken || r?.token;
      if (token) auth.set(token);
      if (r?.user) { onAuthed(r.user); return; }
      const me = await api.me();
      onAuthed(me);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (user) {
    return (
      <div className="panel p-8 max-w-md mx-auto text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-core to-indigo-glow shadow-glow flex items-center justify-center font-display font-bold text-white text-lg">
          {user.email?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <div className="font-display text-white text-lg">{user.email}</div>
          <div className="text-xs text-mist-600">Session active</div>
        </div>
        <button className="btn-ghost mx-auto" onClick={onSignOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="panel max-w-md mx-auto">
      <div className="panel-heading">
        <h3 className="text-sm font-semibold text-white">{mode === "login" ? "Sign in" : "Create account"}</h3>
        <button className="btn-ghost" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Register" : "Have an account?"}
        </button>
      </div>
      <form className="p-5 space-y-4" onSubmit={submit}>
        <Field label="Email"><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}/></Field>
        <Field label="Password"><input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}/></Field>
        {err && <div className="text-xs rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-rose-200">{err}</div>}
        <button className="btn-primary w-full justify-center" disabled={busy}>{busy ? "…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
    </div>
  );
}

/* ------------------------ Shared ------------------------ */
function Skeleton() {
  return (
    <div className="h-full w-full animate-pulse rounded-lg bg-gradient-to-br from-white/[0.03] to-white/[0.01]" />
  );
}
function Empty({ msg }: { msg: string }) {
  return <div className="h-full flex items-center justify-center text-xs text-mist-600">{msg}</div>;
}
