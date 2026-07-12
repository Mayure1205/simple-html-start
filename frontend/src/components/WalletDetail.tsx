import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { api, fmtEth, fmtInt, shortHash, weiToEth } from "@/lib/api";

type Props = { address: string | null; onClose: () => void };

const TX_BUCKETS = [
  { name: "< 1 ETH", min: 0, max: 1 },
  { name: "1 – 10", min: 1, max: 10 },
  { name: "10 – 100", min: 10, max: 100 },
  { name: "100 – 1k", min: 100, max: 1000 },
  { name: "1k+ (whale)", min: 1000, max: Infinity },
];
const BUCKET_COLORS = ["#4f46e5", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"];

async function safe<T>(p: Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try { return { data: await p, error: null }; }
  catch (e: any) { return { data: null, error: e?.message || "Request failed" }; }
}

export function WalletDetail({ address, onClose }: Props) {
  const [summary, setSummary] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [dailyFlow, setDailyFlow] = useState<any[] | null>(null);
  const [flowUnavailable, setFlowUnavailable] = useState(false);
  const [counterparties, setCounterparties] = useState<any[] | null>(null);
  const [cpUnavailable, setCpUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true); setError(null);
    setSummary(null); setTxns([]); setDailyFlow(null); setCounterparties(null);
    setFlowUnavailable(false); setCpUnavailable(false);

    (async () => {
      const [s, t, f, c] = await Promise.all([
        safe(api.walletSummary(address)),
        safe(api.walletTx(address, 0, 50)),
        safe(api.walletDailyFlow(address, 30)),
        safe(api.walletCounterparties(address, 10)),
      ]);
      if (s.error) setError(s.error);
      setSummary(s.data);
      setTxns(t.data?.transactions || []);
      if (f.error) setFlowUnavailable(true); else setDailyFlow(f.data?.days || []);
      if (c.error) setCpUnavailable(true); else setCounterparties(c.data?.counterparties || []);
      setLoading(false);
    })();
  }, [address]);

  const txDistribution = useMemo(() => {
    const buckets = TX_BUCKETS.map((b) => ({ ...b, count: 0 }));
    for (const tx of txns) {
      const eth = tx.valueEth !== undefined ? Number(tx.valueEth) : weiToEth(tx.value);
      const b = buckets.find((x) => eth >= x.min && eth < x.max);
      if (b) b.count += 1;
    }
    return buckets.filter((b) => b.count > 0).map((b) => ({ name: b.name, value: b.count }));
  }, [txns]);

  const flowPoints = useMemo(() => {
    if (!dailyFlow) return [];
    return dailyFlow.map((d: any) => ({
      day: (d.day || "").slice(5),
      inflow: weiToEth(d.inflowWei ?? d.inflow ?? 0),
      outflow: -weiToEth(d.outflowWei ?? d.outflow ?? 0),
      net: weiToEth(d.netWei ?? d.net ?? 0),
    }));
  }, [dailyFlow]);

  const cumulative = useMemo(() => {
    let acc = 0;
    return flowPoints.map((p) => ({ day: p.day, cum: (acc += p.net) }));
  }, [flowPoints]);

  const cpChart = useMemo(() => {
    if (!counterparties) return [];
    return counterparties.slice(0, 10).map((c: any) => ({
      address: shortHash(c.address, 6, 4),
      sent: weiToEth(c.sentWei ?? 0),
      received: weiToEth(c.receivedWei ?? 0),
    }));
  }, [counterparties]);

  const sentEth = weiToEth(summary?.sentValueWei);
  const recvEth = weiToEth(summary?.receivedValueWei);
  const netEth = recvEth - sentEth;

  return (
    <AnimatePresence>
      {address && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-4xl overflow-y-auto border-l border-white/10 bg-ink-950 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-ink-950/90 backdrop-blur-xl px-6 py-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-mist-600">Wallet</div>
                <div className="font-mono text-white text-sm">{address}</div>
              </div>
              <button onClick={onClose} className="btn-ghost">Close ✕</button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="text-xs rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-rose-200">{error}</div>
              )}

              {/* Header stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Received" value={`${fmtEth(recvEth)} ETH`} tone="emerald" />
                <Stat label="Sent" value={`${fmtEth(sentEth)} ETH`} tone="rose" />
                <Stat label="Net flow" value={`${netEth >= 0 ? "+" : ""}${fmtEth(netEth)} ETH`} tone={netEth >= 0 ? "emerald" : "rose"} />
                <Stat label="Total txns" value={fmtInt((summary?.sentCount || 0) + (summary?.receivedCount || 0))} tone="indigo" />
              </div>

              {/* Cumulative net flow */}
              <Panel title="Cumulative net flow (30d)" chip={flowUnavailable ? "endpoint pending" : "ETH"}>
                <div className="h-56 p-4">
                  {loading ? <Skeleton /> :
                   flowUnavailable ? <Pending endpoint="/analytics/wallets/{addr}/daily-flow" /> :
                   cumulative.length === 0 ? <Empty msg="No flow data in window." /> : (
                    <ResponsiveContainer><AreaChart data={cumulative}>
                      <defs><linearGradient id="cumG" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient></defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false}/>
                      <XAxis dataKey="day" tick={{ fill: "#5b6394", fontSize: 11 }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fill: "#5b6394", fontSize: 11 }} axisLine={false} tickLine={false} width={54}/>
                      <Tooltip contentStyle={tooltipStyle}/>
                      <Area type="monotone" dataKey="cum" stroke="#8b5cf6" strokeWidth={2} fill="url(#cumG)" />
                    </AreaChart></ResponsiveContainer>
                  )}
                </div>
              </Panel>

              {/* Inflow vs outflow + tx size distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Panel title="Inflow vs Outflow (daily)" chip="ETH" className="lg:col-span-3">
                  <div className="h-64 p-4">
                    {loading ? <Skeleton /> :
                     flowUnavailable ? <Pending endpoint="/analytics/wallets/{addr}/daily-flow" /> :
                     flowPoints.length === 0 ? <Empty msg="No flow data." /> : (
                      <ResponsiveContainer><BarChart data={flowPoints} stackOffset="sign">
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false}/>
                        <XAxis dataKey="day" tick={{ fill: "#5b6394", fontSize: 11 }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fill: "#5b6394", fontSize: 11 }} axisLine={false} tickLine={false} width={54}/>
                        <Tooltip contentStyle={tooltipStyle}/>
                        <Bar dataKey="inflow" stackId="s" fill="#10b981" radius={[3,3,0,0]}/>
                        <Bar dataKey="outflow" stackId="s" fill="#f43f5e" radius={[0,0,3,3]}/>
                      </BarChart></ResponsiveContainer>
                    )}
                  </div>
                </Panel>

                <Panel title="ETH transfer size mix" chip={`${txns.length} txns · native ETH only`} className="lg:col-span-2">
                  <div className="h-64 p-4">
                    {loading ? <Skeleton /> :
                     txDistribution.length === 0 ? <Empty msg="No transactions." /> : (
                      <ResponsiveContainer><PieChart>
                        <Pie data={txDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                          {txDistribution.map((_, i) => <Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle}/>
                        <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }}/>
                      </PieChart></ResponsiveContainer>
                    )}
                  </div>
                </Panel>
              </div>

              {/* Counterparties */}
              <Panel title="Top counterparties" chip={cpUnavailable ? "endpoint pending" : "top 10"}>
                <div className="h-72 p-4">
                  {loading ? <Skeleton /> :
                   cpUnavailable ? <Pending endpoint="/analytics/wallets/{addr}/counterparties" /> :
                   cpChart.length === 0 ? <Empty msg="No counterparties." /> : (
                    <ResponsiveContainer><BarChart data={cpChart} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                      <XAxis type="number" tick={{ fill: "#5b6394", fontSize: 11 }} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="address" tick={{ fill: "#c7ccf5", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={90}/>
                      <Tooltip contentStyle={tooltipStyle}/>
                      <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }}/>
                      <Bar dataKey="received" stackId="cp" fill="#10b981" radius={[0,3,3,0]}/>
                      <Bar dataKey="sent" stackId="cp" fill="#f43f5e" radius={[0,3,3,0]}/>
                    </BarChart></ResponsiveContainer>
                  )}
                </div>
              </Panel>

              {/* Token holdings — Phase 2 */}
              <Panel title="Token holdings (ERC-20)" chip="Phase 2 · roadmap">
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-center">
                    <div className="md:col-span-2">
                      <div className="flex h-40 w-40 mx-auto items-center justify-center rounded-full border border-dashed border-white/10 relative">
                        <div className="absolute inset-3 rounded-full border border-white/[0.04]" />
                        <div className="text-center">
                          <div className="text-[10px] uppercase tracking-widest text-mist-600">Coming</div>
                          <div className="font-display text-white text-lg">Phase 2</div>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-3">
                      <p className="text-sm text-mist-300 leading-relaxed">
                        Per-token balances (USDT, USDC, LINK, …) with an <span className="text-white">Others</span> slice
                        for dust holdings will appear here. Requires ERC-20 <code className="text-[11px] text-indigo-glow">Transfer</code> log
                        decoding during ingestion and a price feed for USD valuation.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="chip">Decode Transfer logs</span>
                        <span className="chip">token_transfers rollup</span>
                        <span className="chip">CoinGecko price feed</span>
                        <span className="chip">Others bucket &lt; 1%</span>
                      </div>
                      <div className="text-[11px] text-mist-600">
                        Today's donut shows <span className="text-mist-400">native ETH transfer sizes</span>, not token holdings — scoped intentionally to protect MVP timeline.
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Recent large txns */}
              <Panel title="Largest recent transactions" chip={`${Math.min(txns.length, 10)}`}>
                <div className="divide-y divide-white/5">
                  {[...txns].sort((a,b) => (b.valueEth ?? weiToEth(b.value)) - (a.valueEth ?? weiToEth(a.value))).slice(0, 10).map((t: any) => {
                    const eth = t.valueEth ?? weiToEth(t.value);
                    const out = t.fromAddress?.toLowerCase() === address?.toLowerCase();
                    const cp = out ? t.toAddress : t.fromAddress;
                    return (
                      <div key={t.hash} className="grid grid-cols-12 items-center gap-2 px-4 py-2.5 text-xs">
                        <span className="col-span-4 font-mono text-mist-200 truncate">{shortHash(t.hash, 10, 6)}</span>
                        <span className="col-span-2 text-mist-500">blk {fmtInt(t.blockNumber)}</span>
                        <span className="col-span-1"><span className={`chip ${out ? "text-rose-300" : "text-emerald-300"}`}>{out ? "OUT" : "IN"}</span></span>
                        <span className="col-span-3 font-mono text-mist-400 truncate">{shortHash(cp, 8, 4)}</span>
                        <span className="col-span-2 text-right font-mono text-white">{fmtEth(eth)} <span className="text-mist-600">ETH</span></span>
                      </div>
                    );
                  })}
                  {txns.length === 0 && !loading && <div className="p-5 text-xs text-mist-600">No transactions found for this wallet.</div>}
                </div>
              </Panel>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const tooltipStyle = { background: "#0f0f24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 } as const;

function Stat({ label, value, tone }: { label: string; value: string; tone: "emerald" | "rose" | "indigo" }) {
  const dot = tone === "emerald" ? "bg-emerald-400" : tone === "rose" ? "bg-rose-400" : "bg-indigo-glow";
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`}/>
        <div className="stat-label">{label}</div>
      </div>
      <div className="mt-2 font-display text-lg font-semibold text-white truncate">{value}</div>
    </div>
  );
}

function Panel({ title, chip, children, className = "" }: { title: string; chip?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`panel ${className}`}>
      <div className="panel-heading">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {chip && <span className="chip">{chip}</span>}
      </div>
      {children}
    </div>
  );
}

function Skeleton() { return <div className="h-full w-full animate-pulse rounded-lg bg-gradient-to-br from-white/[0.03] to-white/[0.01]" />; }
function Empty({ msg }: { msg: string }) { return <div className="h-full flex items-center justify-center text-xs text-mist-600">{msg}</div>; }
function Pending({ endpoint }: { endpoint: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-1 text-center">
      <div className="text-xs text-mist-400">Backend endpoint not deployed yet</div>
      <code className="text-[10px] text-mist-600 font-mono">GET {endpoint}</code>
    </div>
  );
}
