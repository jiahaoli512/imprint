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
node backend/scripts/checkLocations.js   # ad-hoc location data inspection
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

### Markers, locations, and passive tracking
- Two stores: raw **`Location`** points (every GPS upload, overlap allowed) and **`MapMarkers`** (what the map renders). `MapMarkers` is keyed by `_id` = the user's `_id` (per-user map) or the string `'singleton'` (the admin demo map).
- **Passive tracking** is native-only ([features/location/backgroundTracking.js](frontend/src/features/location/backgroundTracking.js)): the OS emits a point ~every 50m → buffered → `POST /api/locations` → [locationService](backend/src/services/locationService.js) inserts raw points **and** calls `markerService.addMarkersFromPoints`, which de-dupes markers within ~30m (2× the 15.24m marker radius) so circles never overlap. Manual/admin edits (`PUT /api/markers...`) replace the points array as-is (no dedup).

### Frontend
- **Single API layer** [api/client.js](frontend/src/api/client.js): `request` (carries the user token) vs `adminRequest` (admin token), each with `.post/.patch/.put/.del` verb helpers. `profileApiFor(isAdminView)` / `markersApiFor(isAdminView, username)` resolve the right calls so pages avoid `isAdminView ? api.adminX : api.X` branching. **Only `client.js` touches `localStorage`/`sessionStorage`** — use its exported helpers (`getUsername`, `setAdminToken`, `isAdminAuthed`, `clearAdminSession`, …); never read the raw storage keys elsewhere.
- **Platform-specific behavior** is gated by `Capacitor.isNativePlatform()`: passive tracking, search-bar placement are native-only; the "enlarge map" toggle is web-only; web shows a static "tracking off" notice instead of the live panel. Keep these gates when adding cross-platform features.
- **Cross-navigation state** that must survive page unmounts uses module-level observable stores ([features/location/createStore.js](frontend/src/features/location/createStore.js)) — e.g. the located position and tracking status persist across dashboard mounts.
- `frontend/src/features/<domain>/` holds feature code (map, location, users, admin); `components/` are shared UI (note `Modal`/`AuthShell`/`LogoMark`/`MapCard` are the shared shells — prefer them over re-implementing).

### Conventions
- **Commit style**: short title + optional body, no `Co-Authored-By` footer.
- **Moving `v2.1` tag**: on every push to `main`, the `v2.1` tag is force-advanced to the new HEAD (`git tag -f v2.1 && git push origin v2.1 --force`).
- Deployment: frontend → Vercel, backend → Render. `VITE_API_URL` (in `frontend/.env*`) points the web client at the backend; in dev it targets `http://localhost:4000`.
