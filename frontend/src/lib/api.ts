// Thin fetch wrapper. All endpoints are unchanged from the previous static dashboard.
// Auth token is kept in localStorage under the same key so existing users stay signed in.

const TOKEN_KEY = "chainsight.token";

export const auth = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const t = auth.get();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch { /* ignore */ }
    const err: any = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Ingestion
  ingestionStatus: () => request<any>("/api/v1/ingestion/status"),
  startRange: (payload: { chainId: number; fromBlock: number; toBlock: number }) =>
    request<any>("/api/v1/ingestion/range", { method: "POST", body: JSON.stringify(payload) }),
  failedBlocks: () => request<any>("/api/v1/ingestion/failed-blocks"),
  retryFailed: (id: number) =>
    request<any>(`/api/v1/ingestion/failed-blocks/${id}/retry`, { method: "POST" }),

  // Analytics
  networkDaily: (days = 14) => request<any>(`/api/v1/analytics/network/daily?days=${days}`),
  networkLargest: (limit = 10) => request<any>(`/api/v1/analytics/network/largest-transactions?limit=${limit}`),
  walletSummary: (addr: string) => request<any>(`/api/v1/analytics/wallets/${addr}/summary`),
  walletTx: (addr: string, page = 0, size = 20) =>
    request<any>(`/api/v1/analytics/wallets/${addr}/transactions?page=${page}&size=${size}`),
  // Phase 2 endpoints — UI degrades gracefully if backend not yet deployed
  walletDailyFlow: (addr: string, days = 30) =>
    request<any>(`/api/v1/analytics/wallets/${addr}/daily-flow?days=${days}`),
  walletCounterparties: (addr: string, limit = 10) =>
    request<any>(`/api/v1/analytics/wallets/${addr}/counterparties?limit=${limit}`),

  // Auth
  register: (email: string, password: string) =>
    request<any>("/api/v1/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<any>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<any>("/api/v1/auth/me"),

  // Tracked wallets
  tracked: () => request<any[]>("/api/v1/wallets/tracked"),
  track: (walletAddress: string, label?: string) =>
    request<any>("/api/v1/wallets/tracked", { method: "POST", body: JSON.stringify({ walletAddress, label }) }),
  untrack: (id: number) => request<any>(`/api/v1/wallets/tracked/${id}`, { method: "DELETE" }),
};

export function shortHash(h?: string, head = 6, tail = 4) {
  if (!h) return "";
  return h.length <= head + tail + 2 ? h : `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function fmtInt(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === "") return "—";
  const num = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(num)) return String(n);
  return num.toLocaleString();
}

// Convert wei-ish value (number, string, or bigint-string) into ETH float.
export function weiToEth(v: number | string | null | undefined): number {
  if (v === null || v === undefined || v === "") return 0;
  try {
    const s = String(v).replace(/[^0-9-]/g, "");
    if (!s) return 0;
    const neg = s.startsWith("-");
    const abs = neg ? s.slice(1) : s;
    // scale by 1e18
    const padded = abs.padStart(19, "0");
    const intPart = padded.slice(0, -18) || "0";
    const fracPart = padded.slice(-18, -12); // 6 decimals is plenty for chart
    const n = Number(`${intPart}.${fracPart}`);
    return neg ? -n : n;
  } catch { return 0; }
}

export function fmtEth(v: number | string | null | undefined, decimals = 4): string {
  const n = typeof v === "number" ? v : weiToEth(v);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (abs < 0.0001) return n.toExponential(2);
  if (abs >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}
