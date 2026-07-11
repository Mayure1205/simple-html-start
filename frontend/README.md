# ChainSight Frontend

React + Vite + Tailwind operations console for the ChainSight backend.
Design system: **Midnight Indigo** palette, **Space Grotesk + DM Sans** typography, dense dashboard layout.

## Why React (not the old static dashboard)

The previous static HTML/CSS/JS dashboard is preserved in the same output directory only until this build runs. Vite outputs directly into
`backend/src/main/resources/static/dashboard/`, so `mvn spring-boot:run` continues serving the dashboard with **zero backend changes**.

## Scripts

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173, proxies /api -> :8080
npm run build    # emits into ../backend/src/main/resources/static/dashboard/
```

After `npm run build`, restart Spring Boot (or just refresh) and the new UI is served from `/dashboard/index.html`.

## Structure

```
src/
  App.tsx                     # shell + routing (hash-based)
  components/
    Sidebar.tsx               # collapsible-ready nav with animated active pill
    Topbar.tsx                # breadcrumbs + command hint
    StatCard.tsx              # metric card with accent gradient
    Panels.tsx                # Overview / Ingestion / Analytics / Wallets / Failures / Account
  lib/api.ts                  # typed fetch wrapper, JWT header injection
  index.css                   # design tokens + panel/button primitives
```

## API compatibility

Every endpoint the old dashboard hit is preserved:
- `/api/v1/ingestion/*`
- `/api/v1/analytics/network/*`
- `/api/v1/analytics/wallets/{addr}/*`
- `/api/v1/auth/{register,login,me}`
- `/api/v1/wallets/tracked`

No backend contracts were changed.
