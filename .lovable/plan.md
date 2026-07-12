
# Plan: Turn "Track Wallet" into a Whale Watchlist

Goal: give the feature a real purpose so you can defend it in an interview. Right now it's a notepad. After this, it becomes a **personal whale-monitoring dashboard** backed by your ingestion pipeline — which is the actual engineering story recruiters want to hear.

---

## The interview framing (say this out loud)

> "The watchlist isn't just saved addresses. Every tracked wallet is joined against the ingested transactions table. When my ETL pipeline writes a new block, tracked wallets get fresh analytics — balance changes, inflow/outflow, counterparties, and whale-threshold alerts. It demonstrates the warehouse actually powering a user-facing product, not just storing data."

That single sentence justifies the feature.

---

## What we can realistically show (bounded by what's in the DB)

Your `transactions` table already has: `from_address`, `to_address`, `value_wei`, `block_number`, `timestamp`, `gas_used`, `gas_price`. That's enough for a lot. What we CAN'T show without more work: token balances (needs ERC-20 transfer decoding — Phase 2), USD prices (needs price API — Phase 2), NFT holdings (out of scope).

### Per-wallet analytics we can build now

1. **Header stats** — total sent ETH, total received ETH, net flow, tx count, first-seen block, last-seen block, active days.
2. **Net flow over time** (line chart) — cumulative ETH balance change per day. Shows "is this whale accumulating or dumping."
3. **Inflow vs outflow** (dual-bar chart, weekly) — the classic whale-watching view.
4. **Top counterparties** (horizontal bar) — top 10 addresses this wallet transacts with, with sent/received split. Reveals exchange deposits, OTC desks, etc.
5. **Transaction size distribution** (pie/donut) — buckets: <1 ETH, 1–10, 10–100, 100–1k, 1k+. Instantly shows if it's a retail wallet or a whale.
6. **Activity heatmap** (hour × day-of-week grid) — reveals bot vs human patterns. Bots = uniform; humans = clustered.
7. **Recent large transactions** (table) — top 10 by value, with counterparty + block link.

### Watchlist-level views (across all tracked wallets)

8. **Combined portfolio net-flow chart** — sum of all tracked wallets' daily net ETH flow. "Are my whales bullish or bearish this week?"
9. **Whale alert feed** — any tx > threshold (e.g., 100 ETH) involving a tracked wallet, newest first. Ties directly into ingestion — every new block scans for hits.
10. **Watchlist leaderboard** — sort tracked wallets by 7d net flow, tx count, or largest single tx.

---

## Scope split — MVP vs Phase 2

### MVP (this sprint — ~1 day of work)

- Frontend-only additions using existing endpoints + one new endpoint.
- Click tracked wallet row → opens a **Wallet Detail drawer** with:
  - Header stats (already have `walletSummary`)
  - Recent transactions table (already have `walletTx`)
  - **Net flow line chart** (new — needs `/api/analytics/wallet/{addr}/daily-flow`)
  - **Counterparties bar chart** (new — needs `/api/analytics/wallet/{addr}/counterparties?limit=10`)
  - **Tx size distribution donut** (computable frontend-side from existing tx list)
- Watchlist screen gets:
  - Combined net-flow sparkline per row
  - Sort by "7d net flow"
- Delete Account panel as its own screen; move sign-in to topbar dropdown (simplification).

### Phase 2 (mark in README, don't build)

- Whale alerts table (`whale_alerts` already in your schema — wire it up later)
- Activity heatmap
- USD conversion (needs CoinGecko integration)
- ERC-20 token balances
- Email/webhook notifications when tracked wallet crosses threshold

Being explicit about Phase 2 in the README is a **strength** in interviews, not weakness — shows product judgment.

---

## Backend endpoints needed (2 new)

You said you'll implement backend locally, so this section is spec-only:

```
GET /api/analytics/wallet/{address}/daily-flow?days=30
→ { days: [{ day: "2025-11-01", inflowWei, outflowWei, netWei, txCount }] }

GET /api/analytics/wallet/{address}/counterparties?limit=10
→ { counterparties: [{ address, sentToCount, receivedFromCount, netWei }] }
```

Both are single SQL queries with `GROUP BY day` / `GROUP BY counterparty` on the `transactions` table — no new tables, no schema change. Cache in Redis with 60s TTL (fits your existing pattern).

---

## Frontend work (what I'll do after you approve)

1. **New file** `frontend/src/components/WalletDetail.tsx` — slide-in drawer with the 4 charts + tx table. Uses Recharts (already installed).
2. **Update** `frontend/src/components/Panels.tsx`:
   - `WalletsPanel`: rows become clickable, open the drawer; add 7d net-flow sparkline column; add sort dropdown.
   - `AnalyticsPanel`: keep wallet lookup, but the "Analyze" button now opens the same drawer (consistent UX).
3. **Update** `frontend/src/lib/api.ts`: add `walletDailyFlow(addr, days)` and `walletCounterparties(addr, limit)` — they'll gracefully show "Endpoint not deployed yet" until you build the backend, so the UI ships independently.
4. **Move** sign-in to a topbar user menu; remove `AccountPanel` route. Saves a nav slot.
5. **README update** `docs/interview-evidence.md` — add a "Watchlist / Whale Monitoring" row with the interview framing above.

Total: ~1 new component, 2 edits, 1 doc update. Credit-cheap because most is contained in `WalletDetail.tsx`.

---

## What this buys you in the interview

| Question they'll ask | What you can now say |
|---|---|
| "What was the point of the watchlist?" | "Personal whale monitoring — my ETL pipeline feeds real analytics per address." |
| "How does the frontend get counterparty data?" | "Single `GROUP BY` on the transactions table, Redis-cached 60s." |
| "What did you cut and why?" | "Whale alerts + USD prices — I scoped them Phase 2 to protect the MVP timeline." |
| "How would you scale this?" | "Materialize counterparty stats into a daily rollup table, refresh via a scheduled job — same pattern as `daily_network_metrics`." |

---

## Confirm before I build

- OK with the drawer approach (vs. a full dedicated page)?
- OK moving sign-in to the topbar and deleting the Account tab?
- OK that I'll ship the frontend calling the 2 new endpoints even before you've built them (graceful empty state), so we don't block on backend?
