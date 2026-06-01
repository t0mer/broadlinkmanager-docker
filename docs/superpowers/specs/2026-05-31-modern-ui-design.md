# Broadlink Manager — Modern UI & Backend Refactor Design Spec

**Date:** 2026-05-31  
**Branch:** modern-ui  
**Status:** Approved

---

## 1. Overview

Replace the existing AdminLTE 3 / jQuery / Jinja2 server-rendered frontend with a modern React SPA, and refactor the monolithic `broadlinkmanager.py` backend into a clean FastAPI application split across logical router modules. The result is a single Docker container, same port (7020), with a professional dark/light responsive UI.

---

## 2. Approved Design Decisions

| Concern | Decision |
|---|---|
| Framework | React 18 + TypeScript, built with Vite |
| Styling | Tailwind CSS v3 |
| Server state | TanStack Query v5 (React Query) |
| UI state | React context (`ThemeContext`, `PanelContext`) — `PanelContext` holds selected device + active tab for `CommandPanel`; Add/Edit Code modals are component-local state |
| Layout | Icon-only sidebar (56px), expands to 200px on hover |
| Color scheme | Sky Blue / Cyan — dark slate bg (`#0f172a`), accent `#0ea5e9` / `#38bdf8` |
| Dark/light | Dark-first; toggle persists to `localStorage`; Tailwind `dark` class strategy |
| Pages | All 8: Devices, Saved Codes, RF Generator, Livolo, Energenie, Repeats, Convert, About |
| Serving | Embedded — Vite builds to `dist/`; FastAPI serves as static files |
| Backend scope | Full refactor — split into `app/routers/`, Pydantic response models throughout |

---

## 3. Repository Layout (After Refactor)

```
broadlinkmanager/
├── app/
│   ├── main.py                  # FastAPI app factory, mounts static, includes routers
│   ├── routers/
│   │   ├── devices.py           # /autodiscover, /device/ping, /devices/save, /devices/load
│   │   ├── commands.py          # /ir/learn, /rf/learn, /rf/status, /rf/continue, /command/send, /temperature
│   │   └── codes.py             # CRUD /api/code, /api/codes
│   ├── models.py                # All Pydantic request/response models
│   └── db.py                    # SqliteConnector (cleaned up, context-manager pattern)
├── web/                         # React source
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx              # BrowserRouter + ThemeProvider + QueryClientProvider
│   │   ├── api/                 # Typed fetch wrappers (one file per router)
│   │   │   ├── devices.ts
│   │   │   ├── commands.ts
│   │   │   └── codes.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Topbar.tsx
│   │   │   │   └── AppShell.tsx
│   │   │   ├── devices/
│   │   │   │   ├── DeviceTable.tsx
│   │   │   │   ├── DeviceRow.tsx
│   │   │   │   └── StatsRow.tsx
│   │   │   ├── commands/
│   │   │   │   ├── CommandPanel.tsx   # Slide-over panel
│   │   │   │   ├── IrLearnTab.tsx
│   │   │   │   ├── RfLearnTab.tsx
│   │   │   │   └── SendTab.tsx
│   │   │   └── ui/
│   │   │       ├── Badge.tsx
│   │   │       ├── Button.tsx
│   │   │       ├── StatusBanner.tsx
│   │   │       └── Toast.tsx
│   │   ├── pages/
│   │   │   ├── DevicesPage.tsx
│   │   │   ├── SavedCodesPage.tsx
│   │   │   ├── GeneratorPage.tsx
│   │   │   ├── LivoloPage.tsx
│   │   │   ├── EnergenieePage.tsx
│   │   │   ├── RepeatsPage.tsx
│   │   │   ├── ConvertPage.tsx
│   │   │   └── AboutPage.tsx
│   │   ├── hooks/
│   │   │   ├── useTheme.ts
│   │   │   └── useCommandPanel.ts
│   │   └── types/
│   │       └── index.ts          # Shared TypeScript interfaces
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── dist/                         # Vite build output (git-ignored except .gitkeep)
├── broadlinkmanager.py           # Thin launcher — calls uvicorn on app.main:app
├── templates/                    # Kept but unused after migration (can be deleted post-launch)
└── VERSION
```

---

## 4. Backend Refactor

### 4.1 Entry Point

`broadlinkmanager.py` becomes a thin launcher:
```python
import uvicorn
if __name__ == '__main__':
    uvicorn.run("app.main:app", host="0.0.0.0", port=7020, reload=False)
```

### 4.2 `app/main.py`

- Creates the FastAPI instance with metadata, CORS, Prometheus middleware.
- Mounts `dist/` as static files at `/`.
- Registers all three routers under their prefixes.
- Adds a catch-all GET route that serves `dist/index.html` for any path not matched by an API route (SPA fallback).

### 4.3 Routers

**`routers/devices.py`** — prefix `/`
| Method | Path | Description |
|---|---|---|
| GET | `/autodiscover` | Discover devices; `freshscan` query param |
| GET | `/device/ping` | Ping a device by IP; returns `{status, success}` |
| POST | `/devices/save` | Save discovered devices to JSON file |
| GET | `/devices/load` | Load devices from JSON file |

**`routers/commands.py`** — prefix `/`
| Method | Path | Description |
|---|---|---|
| GET | `/ir/learn` | Start IR learning on a device |
| GET | `/rf/learn` | Start RF sweep on a device |
| GET | `/rf/status` | Poll RF learning status |
| GET | `/rf/continue` | Continue RF sweep after frequency lock |
| GET | `/command/send` | Send IR/RF code to a device |
| GET | `/temperature` | Read temperature from a sensor device |

**`routers/codes.py`** — prefix `/api`
| Method | Path | Description |
|---|---|---|
| GET | `/codes` | List all saved codes |
| GET | `/code/{id}` | Get a single code |
| POST | `/code` | Create a code |
| PUT | `/code/{id}` | Update a code |
| DELETE | `/code/{id}` | Delete a code |

### 4.4 Pydantic Models (`app/models.py`)

```python
class DeviceInfo(BaseModel):
    name: str
    type: str
    ip: str
    mac: str

class PingResult(BaseModel):
    status: str   # "online" | "offline" | "timeout"
    success: bool

class CodeBase(BaseModel):
    CodeType: str
    CodeName: str
    Code: str

class CodeRecord(CodeBase):
    CodeId: int

class OperationResult(BaseModel):
    success: int   # 1 | 0 (kept for backwards compat)
    message: str
```

### 4.5 `app/db.py`

- `SqliteConnector` refactored to use a context manager (`with db.connection() as conn`) instead of manual `open_connection` / `close_connection` calls.
- Parameterised queries throughout (already done, kept as-is).
- DB path from env var `DB_PATH`, defaulting to `data/codes.db`.

---

## 5. Frontend

### 5.1 Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:7020',
      '/autodiscover': 'http://localhost:7020',
      '/device': 'http://localhost:7020',
      '/devices': 'http://localhost:7020',
      '/ir': 'http://localhost:7020',
      '/rf': 'http://localhost:7020',
      '/command': 'http://localhost:7020',
      '/temperature': 'http://localhost:7020',
    }
  },
  build: { outDir: '../dist' }
})
```

### 5.2 Routing (`App.tsx`)

```
/              → DevicesPage
/saved         → SavedCodesPage
/generator     → GeneratorPage
/livolo        → LivoloPage
/energenie     → EnergenieePage
/repeats       → RepeatsPage
/convert       → ConvertPage
/about         → AboutPage
```

All routes are wrapped in `AppShell` (sidebar + topbar). React Router v6 `<BrowserRouter>`.

### 5.3 Layout Components

**`AppShell`** renders:
- `Sidebar` (56px, icon-only, expands to 200px on hover via CSS transition on desktop; hidden by default on mobile)
- A hamburger button in the topbar (mobile only) opens the sidebar as a full-height overlay drawer with a backdrop; tapping the backdrop closes it
- A `<main>` content area that contains `<Outlet />`

**`Sidebar`**:
- Logo icon at top
- Nav icons for all 8 pages with tooltips
- Active page: left blue bar indicator (`border-l-2 border-sky-500`)
- Bottom: theme toggle button (sun/moon icon)

**`Topbar`** (per page):
- Page title + subtitle
- Page-specific action buttons (e.g. Rescan, Save to File, + Add Code)

### 5.4 Dark / Light Mode

- Tailwind `darkMode: 'class'` in `tailwind.config.ts`
- `ThemeContext` stores current theme (`'dark' | 'light'`), initialised from `localStorage` or `prefers-color-scheme`
- `useTheme()` hook toggles theme, applies/removes `dark` class on `<html>`, persists to `localStorage`
- All components use Tailwind dark-variant classes: `bg-slate-900 dark:bg-white`, etc.

### 5.5 Color Tokens (Tailwind)

| Token | Dark | Light |
|---|---|---|
| Page background | `slate-950` (#0d1117) | `white` |
| Surface (cards, sidebar) | `slate-900` (#0f172a) | `slate-50` (#f8fafc) |
| Border | `slate-800` (#1e293b) | `slate-100` (#f1f5f9) |
| Primary accent | `sky-500` (#0ea5e9) | `sky-500` (#0ea5e9) |
| Primary accent light | `sky-400` (#38bdf8) | `sky-600` (#0284c7) |
| Body text | `slate-200` (#e2e8f0) | `slate-900` (#0f172a) |
| Muted text | `slate-500` (#64748b) | `slate-400` (#94a3b8) |
| Success | `emerald-400` (#34d399) | `emerald-600` (#059669) |
| Danger | `red-400` (#f87171) | `red-600` (#dc2626) |
| RF accent | `violet-400` (#a78bfa) | `violet-600` (#7c3aed) |

---

## 6. Page Specifications

### 6.1 Devices Page (`/`)

**Data:** `useQuery(['devices'], fetchDevices)` — called on mount, re-fetched on Rescan click.  
**Ping status:** `useQuery(['ping', device.ip], () => pingDevice(device.ip), { refetchInterval: 30000 })` — one query per device, polling every 30s.

**Layout:**
1. Topbar: "Devices" title + Rescan (primary), Save to File, Load from File buttons
2. Stats row: Total Devices, Online count, Saved Codes count, Last Scan time
3. Scan progress bar (shown while `isFetching`)
4. Device table: Name/subtype, Type badge, IP, MAC, Status badge (online/offline), Actions (IR / RF / Send / Temp)
5. Clicking a device row or an action button opens `CommandPanel` (slide-over)

**Mutations:**
- Rescan → `refetch()` on devices query
- Save to File → `useMutation(saveDevices)`
- Load from File → `useMutation(loadDevices)` then invalidate devices query

### 6.2 Command Panel (slide-over, not a page)

Rendered inside `DevicesPage`. Slides in from the right when a device is selected. Contains three tabs:

**IR Tab:**
1. Click "Learn IR" → `GET /ir/learn?host=…&mac=…` → status banner "Waiting for signal…"
2. On success: code appears in input, copy button enabled, Save row appears
3. Save → `POST /api/code` → toast, code cleared ready for next

**RF Tab:**
1. Step tracker: Hold (step 1) → Press (step 2) → Save (step 3)
2. "Learn RF" → `GET /rf/learn?host=…&mac=…` → polls `GET /rf/status` every 1s via `refetchInterval`
3. When status = frequency locked → auto-advance to step 2, show "Continue Sweep" button
4. "Continue Sweep" → `GET /rf/continue?host=…&mac=…` → polls status again
5. When code captured → step 3, code in input, Save row appears

**Send Tab:**
1. Paste area for raw Base64 code
2. Divider: "or pick from saved"
3. Inline list from `useQuery(['codes'], fetchAllCodes)` — each row has Send button
4. "Send" → `GET /command/send?host=…&mac=…&command=…` → success/error banner

### 6.3 Saved Codes Page (`/saved`)

**Data:** `useQuery(['codes'], fetchAllCodes)`

**Layout:**
1. Topbar: "Saved Codes" + Export CSV, + Add Code buttons
2. Search input (client-side filter on name)
3. Filter pills: All / IR / RF
4. Table: #, Name, Type badge, Code preview (truncated monospace), Actions (Send, Edit, Delete)
5. Pagination (client-side, 10 rows/page)

**Mutations:**
- Add Code → modal form → `POST /api/code` → invalidate `['codes']`
- Edit → inline edit row or modal → `PUT /api/code/{id}` → invalidate
- Delete → confirm toast → `DELETE /api/code/{id}` → invalidate
- Send → opens CommandPanel on most-recently-used device, pre-fills Send tab with the code

### 6.4 RF Generator (`/generator`)

Ports existing generator logic to React. Form inputs: frequency (433 / 315 MHz selector), pulse count, repeat count. Output: generated code in monospace textarea with copy button. Save button → `POST /api/code`.

### 6.5 Livolo Page (`/livolo`)

Form: group (0–3), unit (1–3). Generates Livolo RF code client-side (ports `generator.js` logic). Copy + Save buttons.

### 6.6 Energenie Page (`/energenie`)

Form: socket number (1–4). Generates Energenie code client-side. Copy + Save buttons.

### 6.7 Repeats Page (`/repeats`)

Form: paste existing code, new repeat count. Transformation runs client-side (ports `hex.js` logic). Output in monospace textarea with copy + Save buttons.

### 6.8 Convert Page (`/convert`)

Two-panel: Hex → Base64 and Base64 → Hex. Live conversion as user types (no submit needed). Copy buttons on each output.

### 6.9 About Page (`/about`)

Static: version fetched from `GET /api/version` (reads the `VERSION` file at runtime), GitHub link, PayPal donate button, short description.

`/api/version` is a one-liner added to `app/main.py` (not a full router):
```python
@app.get("/api/version")
def get_version():
    return {"version": GetVersionFromFile()}
```

---

## 7. Data Flow Summary

```
User action
    │
    ▼
React component (page or CommandPanel)
    │
    ├─ reads ──► useQuery([key], apiFn)  ──► api/devices.ts (fetch)  ──► FastAPI router
    │                                                                        │
    │                                                                        ▼
    │                                                                   Pydantic model
    │                                                                        │
    │                                                                        ▼
    └─ mutates ► useMutation(apiFn) ──────────────────────────────── JSON response
                     │
                     └─ onSuccess: queryClient.invalidateQueries([key])
                                   + Toast notification
```

---

## 8. Error Handling

- API errors return `{"success": 0, "message": "..."}` or HTTP 4xx/5xx — TanStack Query surfaces these via `isError` / `error`.
- `StatusBanner` component renders inline error/success inside panels (replaces SweetAlert).
- Toast component (top-right, auto-dismiss 3s) for mutation feedback (saved, deleted, sent).
- Offline devices: actions are visually disabled (opacity-40, `disabled` attribute) but not hidden.

---

## 9. Development Workflow

```bash
# Terminal 1 — FastAPI backend
cd broadlinkmanager
python broadlinkmanager.py

# Terminal 2 — React dev server (proxies API to :7020)
cd broadlinkmanager/web
npm run dev        # → http://localhost:5173

# Production build
cd broadlinkmanager/web
npm run build      # → broadlinkmanager/dist/
# FastAPI serves dist/ on :7020
```

---

## 10. Deployment (Docker)

No changes to the Dockerfile structure — the build step produces `dist/` which FastAPI serves. The Dockerfile gains a Node build stage:

```dockerfile
FROM node:20-alpine AS frontend
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci --silent
COPY web/ ./
RUN npm run build   # → /app/dist

FROM python:3.12-slim AS runtime
# ... existing python setup ...
COPY --from=frontend /app/dist ./dist
```

---

## 11. Migration Strategy

1. Backend refactor first (routers, models) — all existing API contracts preserved.
2. Build React app against the refactored backend.
3. Once React app is complete, remove Jinja2 template routes from `pages.py` (now replaced by SPA catch-all).
4. Remove `templates/` directory and old static JS/CSS that AdminLTE provided.
5. Keep `dist/` in `.gitignore` (except `.gitkeep`); build in CI.

---

## 12. Out of Scope

- Authentication / login — not in the current app, not added here.
- WebSocket real-time updates — polling via React Query is sufficient.
- Mobile native app — responsive web only.
- Unit tests — deferred to a follow-up.
