# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root unless noted. There is **no test suite** (`backend test` is a stub); verify changes by building and exercising the running app.

```bash
npm run dev                 # runs frontend (Vite :5173) + backend (nodemon :4000) together
npm run dev:frontend        # frontend only
npm run dev:backend         # backend only
npm run build --prefix frontend   # production web build (dist/) — use this to typecheck-ish verify FE changes
npm run lint  --prefix frontend   # ESLint
npm run locations:check --prefix backend            # ad-hoc location data inspection
npm run markers:respace --prefix backend            # DRY-RUN: re-thin existing markers to the 100m spacing
npm run markers:respace --prefix backend -- --apply # ...persist it (irreversible; --apply writes, dry-run is default)
```

Install deps in all three places: `npm install && npm install --prefix frontend && npm install --prefix backend`.
Env: `cp backend/.env.example backend/.env` (needs `JWT_SECRET`, `MONGODB_URI`, `ADMIN_PASSWORD`, `BREVO_API_KEY`, `EMAIL_USER`). MongoDB must be running locally; the local dev DB is `mongodb://localhost:27017/imprint` (production data lives on a separate Atlas cluster — be careful running scripts/tests against a real user).

iOS (Capacitor) — the native app wraps the web build, so rebuild + sync after FE changes:
```bash
cd frontend && npm run build && npx cap sync ios && npx cap open ios
```
`frontend` has a `patch-package` postinstall that patches `@capacitor-community/background-geolocation` (adds a native `getAuthorizationStatus`). Don't `npm audit fix --force` the geolocation plugin or bump Capacitor off 7 without re-validating the patch.

## Architecture

Three npm packages: root (orchestration + git), `backend/` (Express 5 API), `frontend/` (React + Vite, also packaged to iOS via Capacitor 7).

### Backend: routes → services → models (keep routes thin)
- **Routes** ([backend/src/routes](backend/src/routes)) are HTTP-only: parse the request, call a service, send the result. They must not contain validation or business logic. The `handle()` middleware wraps async handlers; services throw `httpError(status, msg)` and a single central error handler in [index.js](backend/src/index.js) formats the response (and hides messages on non-tagged 500s). Don't hand-roll `res.status().json({error})` in routes.
- **Services** ([backend/src/services](backend/src/services)) own validation + logic. Validation helpers live in [utils/validate.js](backend/src/utils/validate.js) (`checkRequired`, `checkLength` + the shared `LIMITS` table, `checkEmail`, `validateName`, `normalizeEmail`/`normalizeUsername`). Always normalize emails/usernames through these before querying (Mongoose only lowercases on *save*, not on queries).
- **Middleware** ([backend/src/middleware](backend/src/middleware)): `auth` (user JWT), `adminAuth` (admin JWT, `role==='admin'`), `userOrAdmin`, `optionalAuth`; plus `rateLimit`, `sanitize` (strips `$`/dotted keys from bodies — Express 5's default query parser is `simple`, so query strings can't carry nested operators).

### Auth & authorization (the important mental model)
- **Two independent JWTs**: a user token and an admin token. The admin token is minted **only** by `POST /api/admin/login` with the correct `ADMIN_PASSWORD` (constant-time compare in [adminService](backend/src/services/adminService.js)).
- The client-side `admin_auth` flag (sessionStorage) is **cosmetic UI gating only** — it just decides whether to render admin screens. All authorization is enforced **server-side**: admin routes require `requireAdminAuth`; profile/marker edits enforce ownership in the service (`if (!isAdmin && owner !== viewerId) throw 403`). A spoofed flag yields an empty admin shell where every API call 401s/403s.
- User and admin sessions are **mutually exclusive** on the client: logging in as one clears the other.
- **Profile-edit cooldowns**: self-service username (30d) and first/last name (7d) changes are rate-limited in [userService](backend/src/services/userService.js) via `User.usernameChangedAt`/`nameChangedAt` timestamps (helpers in [validate.js](backend/src/utils/validate.js): `validateUsername`, `COOLDOWN_DAYS`, `daysUntil`). Admins bypass the cooldown **and never write the stamps**, so an admin edit doesn't start/reset a user's own clock.

### Markers, locations, and passive tracking
- Two stores: raw **`Location`** points (every GPS upload, overlap allowed) and **`MapMarkers`** (what the map renders). `MapMarkers` is keyed by `_id` = the user's `_id` (per-user map) or the string `'singleton'` (the admin demo map).
- **Passive tracking** is native-only ([features/location/backgroundTracking.js](frontend/src/features/location/backgroundTracking.js)): the OS emits a point ~every 100m (`distanceFilter`) → buffered → `POST /api/locations` → [locationService](backend/src/services/locationService.js) inserts raw points **and** calls `markerService.addMarkersFromPoints`, which drops any marker within `MARKER_SPACING_M` (100m) of an existing one so the map is a sparse trail, not a continuous tube (spatial-hash grid, O(n)). Marker spacing is **decoupled** from the 15.24m render radius (`MARKER_RADIUS_M`, just the drawn circle). The shared `thinPoints` helper also backs the `markers:respace` migration that re-thins legacy dense data. Manual/admin edits (`PUT /api/markers...`) replace the points array as-is (no dedup).
- Marker saves send the **whole** points array, which on a busy map exceeds the global 100kb JSON limit, so `/api/markers` gets a dedicated **4mb** body parser (mounted before the global 100kb one, which then skips re-parsing) — see [index.js](backend/src/index.js). Saved arrays are still capped at `MAX_POINTS` (50000) by `validatePoints`.

### Frontend
- **Single API layer** [api/client.js](frontend/src/api/client.js): `request` (carries the user token) vs `adminRequest` (admin token), each with `.post/.patch/.put/.del` verb helpers. `profileApiFor(isAdminView)` / `markersApiFor(isAdminView, username)` resolve the right calls so pages avoid `isAdminView ? api.adminX : api.X` branching. **Only `client.js` touches `localStorage`/`sessionStorage`** — use its exported helpers (`getUsername`, `setAdminToken`, `isAdminAuthed`, `clearAdminSession`, …); never read the raw storage keys elsewhere. The one sanctioned exception is passive-tracking state (`imprint_tracking_enabled`, `imprint_tracking_buffer`), owned directly by [backgroundTracking.js](frontend/src/features/location/backgroundTracking.js).
- **Platform-specific behavior** is gated by `Capacitor.isNativePlatform()`: passive tracking, search-bar placement are native-only; the "enlarge map" toggle is web-only; web shows a static "tracking off" notice instead of the live panel. Keep these gates when adding cross-platform features.
- **Cross-navigation state** that must survive page unmounts uses module-level observable stores ([features/location/createStore.js](frontend/src/features/location/createStore.js)) — e.g. the located position and tracking status persist across dashboard mounts.
- **Map region + discovery**: `RegionDetector` ([features/map/mapUtils.js](frontend/src/features/map/mapUtils.js)) reverse-geocodes the map center (Nominatim) into the toolbar place label; `getLevel(zoom)` maps zoom→level (≤3 Earth, 4 continent, … city). Over **water** it names the nearest **ocean** (open sea) or **continent** (coastal) instead of blank, via the shared coordinate→place helpers `continentContaining`/`oceanAt`/`CONTINENT_BBOX` (also in mapUtils). The discovery gauge ([features/map/discovery.js](frontend/src/features/map/discovery.js) + `useDiscovery`, shown beside the map on **both** platforms) reuses those same helpers. The panel's **name comes from the region the % was computed for** (`useDiscovery` carries `region.name`), not the toolbar label — so the name and the number always describe the same place and update **together** on settle (the toolbar label, driven by `RegionDetector` on `moveend`, leads slightly during the ~2s settle; they converge after). `fetchRegionGeometry` caches boundaries by level + rounded lat/lng — **city** level rounds finer (3 decimals ≈ 110m) so crossing a city border refetches the right polygon instead of reusing the neighbour's. It shows "% of the current region discovered": markers bucketed into **area-relative** grid cells (scale-invariant, `TARGET_CELLS` per level) over the region's geodesic area; continents/oceans have no polygon so they use static areas + bbox marker filtering. A `DiscoverySettleTracker` recomputes ~2s after the map stills (geometry math is hand-rolled — no turf).
- **Marker rendering + Map Quality** ([features/map/MapView.jsx](frontend/src/features/map/MapView.jsx)): a map can hold thousands of points, so `MarkerLayer` thins them to the view — cull to the padded viewport, dedup to one pin per ~screen-cell, cap at `MAX_RENDERED_PINS` — and draws constant-size DOM pins (smooth zoom) or canvas `CircleMarker`s. Which steps apply is the **Map Quality** tier (Low→Max), a per-device setting in localStorage ([features/map/mapQuality.js](frontend/src/features/map/mapQuality.js), default Medium = cull+dedup+cap+DOM). This is **render-only** — the discovery % always uses the full marker set, never the thinned one.
- **Badges** ([features/badges/](frontend/src/features/badges)): a profile gallery built on a **category registry** ([categories/index.js](frontend/src/features/badges/categories/index.js) — array order = carousel order). Each category is `{ id, title, subtitle, getBadges(ctx) }` and returns a list of **normalized badge objects** that the generic [Badge.jsx](frontend/src/features/badges/Badge.jsx) renders — so **adding a category is a new file + one registry line**, no change to `Badge` or [BadgesModal.jsx](frontend/src/features/badges/BadgesModal.jsx). A badge's `coin` field picks the coin face (`check` / value+unit / `flag` = `fi fi-<code>` from flag-icons / `img` = an SVG URL for state flags); `c1`/`c2`/`halo`/`spin`/`delay` (and optional `ring`) are per-badge **data** (inline styles), while structure lives in `.badge-*` CSS. **Earned state is client-side** (`accountAge` from `user.createdAt`; `countries`/`statesUS` are all-locked until visited-detection lands) — `getBadges` receives a shared `ctx` (today `{ user }`). `BadgesModal` is a wrap-around carousel (arrows/swipe/dots, slide animation) with a name search + Unlocked/Locked/All status filter on large categories and a multi-select continent filter when badges carry a `continent`.
- `frontend/src/features/<domain>/` holds feature code (map, location, users, badges, admin); `components/` are shared UI (note `Modal`/`AuthShell`/`LogoMark`/`MapCard`/`FieldLabel` are the shared shells, `useForm` the shared auth-form hook, and `.icon-btn` the shared round-button class — prefer them over re-implementing).
- **Cold-start resilience**: the backend is on Render's free tier (sleeps ~15min idle → slow cold start). An **external uptime monitor** (UptimeRobot) pings `/health` every ~5min to keep it warm — a GitHub Actions cron was tried but its scheduled runs are throttled to every 1–4h, too sparse for the 15min timeout. As a backstop, dashboard data loads (`useUser`, `useMarkers`) retry transient failures via [utils/retry.js](frontend/src/utils/retry.js) (network/5xx/timeout only, never 4xx) so a cold start self-heals instead of rendering empty.

### Conventions
- **Commit style**: short title + optional body, no `Co-Authored-By` footer.
- **Work on `main`**: commit directly to `main` (no feature branches / PRs unless explicitly asked).
- **Moving `v2.4` tag**: on every push to `main`, the `v2.4` tag is force-advanced to the new HEAD (`git tag -f v2.4 && git push origin v2.4 --force`). (`v2.1`, `v2.2`, `v2.3` and earlier are frozen historical markers — don't move them; `v2.3` is frozen at `b98b42d`.)
- Deployment: frontend → Vercel, backend → Render. `VITE_API_URL` (in `frontend/.env*`) points the web client at the backend; in dev it targets `http://localhost:4000`.
