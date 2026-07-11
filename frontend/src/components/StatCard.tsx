import { motion } from "framer-motion";

export function StatCard({
  label, value, delta, hint, accent = "indigo",
}: {
  label: string; value: string | number; delta?: string; hint?: string;
  accent?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const accents: Record<string, string> = {
    indigo: "from-indigo-core/40 to-indigo-glow/10 text-indigo-glow",
    emerald: "from-emerald-500/40 to-emerald-300/10 text-emerald-300",
    amber: "from-amber-400/40 to-amber-200/10 text-amber-300",
    rose: "from-rose-500/40 to-rose-300/10 text-rose-300",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="panel p-5 overflow-hidden"
    >
      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${accents[accent]}`} />
      <div className="stat-label">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="stat-value">{value}</div>
        {delta && <span className={`text-xs font-medium ${accents[accent].split(" ").pop()}`}>{delta}</span>}
      </div>
      {hint && <div className="mt-2 text-xs text-mist-600">{hint}</div>}
    </motion.div>
  );
}
