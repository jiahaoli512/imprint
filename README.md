# Imprint (v2.4) *Updated Jun 27, 2026*

How much of the world have you seen?

Introducing **Imprint**

Imprint maps every place you've ever been - turning your travels into a living portrait of your world. See your coverage, explore what's left, and share the journey.

## Stack

- **Frontend** — React + Vite, React Router, React‑Leaflet (maps), lucide‑react (icons), flag‑icons (country/state flags)
- **Mobile** — iOS app via Capacitor 7 (wraps the web build); background location via `@capacitor-community/background-geolocation`
- **Backend** — Node.js + Express 5, structured into routes → services → models
- **Database** — MongoDB via Mongoose
- **Email** — Brevo (Sendinblue) transactional API for approval and contact‑form emails
- **Auth** — JWT for users and admins; bcrypt password hashing
- **Deployment** — Frontend on Vercel, backend on Render (an external uptime monitor pings `/health` to limit free‑tier cold starts; the web client also retries transient load failures)

## Features

- **Waitlist** — public signup; admins approve entries, which triggers an approval email
- **Accounts** — registration is gated to approved waitlist emails; passwords are hashed with bcrypt
- **Profiles** — username, first/last name, and an 18+ date‑of‑birth gate set during onboarding
- **Interactive map** — a Leaflet map of per‑user markers, built passively from mobile background tracking (admins can also edit a user's map); zoom‑aware region labels (city → county → state → country → continent → Earth) via reverse geocoding. Over water the label names the nearest **ocean** (open sea) or **continent** (coastal) instead of going blank.
- **Discovery gauge** — a radial gauge showing the **% of the current region you've discovered** (markers bucketed into scale‑invariant grid cells over the region's area). Its place name always matches the map's region label, including oceans/continents.
- **Map Quality** — a per‑device setting (Low → Medium → High → Ultra High → Max) trading marker fidelity for performance: it controls viewport culling, screen‑grid thinning, a render cap, and DOM‑pin vs. canvas rendering. Medium (the default) keeps large maps smooth; this is render‑only and never affects the discovery %.
- **Locate me** — a one‑shot "where am I" control (web and mobile) that drops a blue location circle and flies to street‑level zoom
- **Enlarge map** — a web‑only toggle that grows the map to fill the content area (header/footer untouched)
- **Passive tracking (mobile)** — opt‑in background location that records a point roughly every 100 m of movement and passively builds your map; new places become markers, thinned to a sparse 100 m trail rather than a continuous tube. On the web a static notice explains it's mobile‑only.
- **Badges** — an achievement gallery on every profile (opened from a "Badges" button), organised into swipeable categories with a slide animation, position dots, and a per‑category earned count + percentage. Categories: **Account milestones** (animated medallions awarded by account age — Account Created → One Year, computed client‑side from `createdAt`), **Passports** (a flag medallion per country, tinted by continent), and **Passports (United States)** (the 50 states + D.C. with a red/white/blue theme). Large categories get a name search; Passports adds a multi‑select continent filter; all categories share an Unlocked / Locked / All status filter. Earned badges animate (breathe, spinning ring, sparkle, ribbon tails); locked ones are grayed. Long names truncate, and a scroll‑to‑top button appears on long lists. Mobile compacts the grid to ~3 per row.
- **Public profiles & search** — look up other users by username and view their profiles (signed‑in users only)
- **Admin dashboard** — password‑protected (server‑side) panel to manage the waitlist and edit any user's map/profile
- **Privacy Policy & Contact** — a `/privacy` policy page and a `/contact` form that emails the Imprint inbox, both linked from the footer
- **Mobile app** — the same experience packaged for iOS through Capacitor

## Project structure

```
backend/
  src/
    routes/        # thin HTTP handlers (admin, users, waitlist, markers, locations, contact)
    services/      # business logic (admin, users, waitlist, markers, locations, contact)
    middleware/    # auth, adminAuth, userOrAdmin, optionalAuth, rateLimit, sanitize, handle
    models/        # Mongoose schemas (User, Waitlist, MapMarkers, Location)
    utils/         # validate, email, httpError
frontend/
  src/
    pages/         # route components (Home, Login, Signup, Profile, Dashboard,
                   #   AdminDashboard, Admin, UserProfile, PrivacyPolicy, Contact, ...)
    components/    # shared UI (AuthShell, Modal, LogoMark, FieldLabel, LogoutModal,
                   #   AdminLoginModal, ConfirmModal, Spinner, Footer, Nav, ...)
    auth/          # route guards
    features/map/      # Leaflet map (MapView, MapCard, useMarkers, mapUtils),
                       #   discovery gauge (discovery, useDiscovery, DiscoveryPanel),
                       #   render quality (mapQuality, MapQualityModal)
    features/location/ # geolocation + passive tracking (useGeolocation,
                       #   backgroundTracking, LocationTrackingPanel, WebTrackingNotice)
    features/users/    # user search, useUser/useProfileEdit, ProfileToolbar
    features/badges/   # badges modal + carousel (BadgesModal, Badge) and a
                       #   category registry (categories/: accountAge, countries,
                       #   statesUS) — add a category = a new file + one line
    features/admin/    # waitlist + users tables and their hooks
    utils/         # validateName, fullName, matchesQuery, formatDate, retry,
                   #   useForm, hooks
    assets/        # static assets (state-flags/ — US state/territory SVGs)
    api/client.js  # single API layer + session/token helpers
  ios/             # Capacitor iOS project
```

## Getting started

**Prerequisites:** Node.js, MongoDB running locally.

```bash
# Install dependencies (root, frontend, backend)
npm install
npm install --prefix frontend
npm install --prefix backend
```

Copy the backend env file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

```
PORT=4000
JWT_SECRET=<long random secret>
MONGODB_URI=mongodb://localhost:27017/imprint

# Comma-separated production frontend origins. localhost ports,
# capacitor://localhost, and this project's Vercel deploys (matched by
# project slug, set via VERCEL_PROJECT_SLUG, default "imprint") are always allowed.
ALLOWED_ORIGINS=https://your-frontend.vercel.app

# Email (Brevo transactional API)
BREVO_API_KEY=<brevo api key>
EMAIL_USER=donotreply.yourdomain.com   # used as the "from" address

# Admin panel password (use a long, random value)
ADMIN_PASSWORD=<strong admin password>
```

Start both servers (frontend + backend) from the repo root:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:4000`. If `5173` is taken, Vite picks another port — CORS allows any localhost port in development.

## Email (Brevo)

Approval emails (on waitlist approval) and contact‑form submissions are sent through the Brevo transactional API.

1. Create a Brevo account and generate an API key
2. Set `BREVO_API_KEY` in `backend/.env`
3. Set `EMAIL_USER` to a verified sender address

## iOS app (Capacitor)

The iOS app bundles the web build, so changes must be rebuilt and synced:

```bash
cd frontend
npm run build       # produce the web build (dist/)
npx cap sync ios    # copy the build into the iOS project + update native deps
npx cap open ios    # open in Xcode to run on a simulator/device or archive
```

Some behaviors are intentionally platform‑specific (e.g. the search bar position, the "enlarge map" toggle, and passive background tracking), gated via `Capacitor.isNativePlatform()`.

### Passive background tracking

Background location uses `@capacitor-community/background-geolocation` and is **native‑only** — it requests "Always" location permission and records a point about every 100 m of movement. Uploaded points are stored as raw history and passively turned into map markers, thinned so no two markers sit within 100 m of each other (a sparse trail, not a continuous tube). On the web the feature is unsupported; the dashboard shows a static "Location Tracking: OFF" notice instead.

## Admin dashboard

Open the **Admin** link in the site footer (web only) and enter `ADMIN_PASSWORD`. Authentication is verified **server‑side**, which returns a short‑lived admin JWT used for all admin API calls. From the dashboard you can approve/reorder/delete waitlist entries, view registered users (with name and date of birth), and edit any user's map or profile. A user session and an admin session are mutually exclusive — logging in as one clears the other.

## Security

The backend enforces security server‑side (not just in the UI):

- **Authentication** — JWT for users and admins; protected routes require a valid token, and profile edits require ownership (or admin)
- **Admin auth** — the admin password is validated server‑side in constant time; the panel uses a signed admin JWT, never a client‑side password check. The client‑side admin flag is cosmetic — every admin route still verifies the admin JWT
- **Authorization** — per‑user markers and location history are gated to a signed‑in user or admin (not public); profile edits enforce ownership in the service layer
- **Rate limiting** — a general API limiter, a strict limiter on login/registration/admin‑login, and a dedicated cap on the public contact form
- **CORS allowlist** — restricted to known origins (configurable via `ALLOWED_ORIGINS`), plus localhost (dev), `capacitor://localhost` (iOS), and this project's Vercel deploys (matched by project slug — not any `*.vercel.app`)
- **Security headers** — Helmet, with JSON body-size caps (100 kb globally; a larger 4 MB limit only on the marker‑save routes, which carry the full points array)
- **Input validation** — length limits, name character rules, email‑format checks, a 4‑digit DOB/18+ check, and a password policy (≥12 chars with mixed character classes) all enforced server‑side
- **NoSQL injection hardening** — request bodies are scrubbed of Mongo operators (`$…`), dotted keys, and prototype‑pollution keys (`__proto__`/`constructor`/`prototype`); query values are normalized to strings
- **Credential exposure** — the bcrypt `passwordHash` is `select: false`, so it's excluded from queries by default and only the login path opts it in
- **CSV‑injection‑safe export** — the waitlist CSV escapes quotes and neutralizes formula triggers (`= + - @`)
- **Email‑enumeration hardening** — the public waitlist check collapses to `approved` / `unavailable`, and the join endpoint gives one indistinguishable response for already‑registered vs. already‑waitlisted, so neither reveals whether an email has an account; login timing is equalized for the same reason
- **Privacy** — date of birth is returned only to the profile owner or an admin; secrets live in `backend/.env` (gitignored)

> Note: set `ALLOWED_ORIGINS` and a strong `ADMIN_PASSWORD` in your production host (e.g. Render) before deploying. Because the admin password is the single factor that mints an admin token, keep both `ADMIN_PASSWORD` and `JWT_SECRET` strong.
