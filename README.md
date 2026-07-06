# Imprint (v2.6) *Updated Jul 5, 2026*

How much of the world have you seen?

Introducing **Imprint**

Imprint maps every place you've ever been - turning your travels into a living portrait of your world. See your coverage, explore what's left, and share the journey.

## Stack

- **Frontend** — React + Vite, React Router, React‑Leaflet (maps), lucide‑react (icons), flag‑icons (country/state flags)
- **Mobile** — iOS app via Capacitor 7 (wraps the web build); background location via `@capacitor-community/background-geolocation`
- **Backend** — Node.js + Express 5, structured into routes → services → models
- **Database** — MongoDB via Mongoose
- **Email** — Brevo (Sendinblue) transactional API for approval, signup/reset verification codes, contact‑form, and friend‑request/accepted emails
- **Auth** — JWT for users and admins; bcrypt password hashing; emailed 6‑char verification codes for signup and password reset; server‑side session revocation on password reset (`tokenVersion`)
- **Deployment** — Frontend on Vercel, backend on Render (an external uptime monitor pings `/health` to limit free‑tier cold starts; the web client also retries transient load failures)

## Features

- **Waitlist** — public signup; admins approve entries, which triggers an approval email
- **Accounts** — registration is gated to approved waitlist emails and a **6‑char email verification code** (bcrypt‑hashed at rest, 30‑min TTL, attempt‑capped, resend‑throttled), enforced server‑side; passwords are hashed with bcrypt
- **Forgot password** — email → reset code → change password or skip & log in. Verifying the reset code proves inbox control and returns a login token; setting a new password revokes all other sessions and keeps the resetting client signed in
- **Profiles** — username, first/last name, and an 18+ date‑of‑birth gate set during onboarding. Self‑service username (30‑day) and name (7‑day) changes are cooldown‑limited; admins bypass the cooldown
- **Interactive map** — a Leaflet map of per‑user markers, built passively from mobile background tracking (admins can also edit a user's map); zoom‑aware region labels (city → county → state → country → continent → Earth) via reverse geocoding. Over water the label names the nearest **ocean** (open sea) or **continent** (coastal) instead of going blank.
- **Discovery gauge** — a radial gauge showing the **% of the current region you've discovered** (markers bucketed into scale‑invariant grid cells over the region's area). Its place name always matches the map's region label, including oceans/continents.
- **Map Quality** — a per‑device setting (Low → Medium → High → Ultra High → Max), set in **Settings → Display**, trading marker fidelity for performance: it controls viewport culling, screen‑grid thinning, a render cap, and DOM‑pin vs. canvas rendering. Medium (the default) keeps large maps smooth; this is render‑only and never affects the discovery %.
- **Locate me** — a one‑shot "where am I" control (web and mobile) that drops a blue location circle and flies to street‑level zoom
- **Enlarge map** — a web‑only toggle that grows the map to fill the content area (header/footer untouched)
- **Passive tracking (mobile)** — opt‑in background location that records a point roughly every 100 m of movement and passively builds your map; new places become markers, thinned to a sparse 100 m trail rather than a continuous tube. On the web a static notice explains it's mobile‑only.
- **Badges** — an achievement gallery on every profile (opened from a "Badges" button), organised into swipeable categories with a slide animation, position dots, and a per‑category earned count + percentage. Categories: **Account milestones** (animated medallions awarded by account age — Account Created → One Year, computed client‑side from `createdAt`), **Passports** (a flag medallion per country, tinted by continent), and **Passports (United States)** (the 50 states + D.C. with a red/white/blue theme). Large categories get a name search; Passports adds a multi‑select continent filter; all categories share an Unlocked / Locked / All status filter. Earned badges animate (breathe, spinning ring, sparkle, ribbon tails); locked ones are grayed. Long names truncate, and a scroll‑to‑top button appears on long lists. Mobile compacts the grid to ~3 per row.
- **Friends** — send/accept/reject friend requests (a single directed edge; reject is a hard delete that frees a re‑request). Profiles show a friend count and your relationship; the friend list is visible to the owner and friends only. A user's markers/badges are gated to the owner, admins, and **friends**, so badges show as locked on a non‑friend's profile. Each request emails the recipient (first name only), rate‑limited to 30/hour
- **Notifications & activity** — a header notification bell (own dashboard + profile) drops down two sections: pending friend **requests** and an **activity** feed (e.g. "@x accepted your friend request"), newest‑first with relative timestamps. The badge counts pending requests plus unseen activity (unseen tracked client‑side). The activity feed is a source registry — adding a new activity type is one source function + one renderer
- **Settings** — a gear next to the bell opens a tabbed modal (Display · Account · Notifications · Privacy; only Display is implemented). **Display** exposes five per‑device preferences: **Map Quality**, **Map Base Style** (Dark / Light / Streets, all CARTO; dark default; tiles swap live), **Point Color** (the marker color — brand + rainbow presets plus an always‑expanded HSV picker with drag / RGB / hex entry; points re‑color live), **Point Opacity** (a −100%…+100% slider; +100% fully opaque, −100% transparent, 0 = default), and **Reduce Motion** (force‑disables animations/transitions, applied before first paint). All persist per device, unsynced to the account
- **Public profiles & search** — look up other users by username and view their profiles (signed‑in users only)
- **Admin dashboard** — password‑protected (server‑side) panel to manage the waitlist and edit any user's map/profile
- **Privacy Policy & Contact** — a `/privacy` policy page and a `/contact` form that emails the Imprint inbox, both linked from the footer
- **Mobile app** — the same experience packaged for iOS through Capacitor

## Project structure

```
backend/
  src/
    routes/        # thin HTTP handlers (admin, users, friends, activity, waitlist,
                   #   markers, locations, verification, contact)
    services/      # business logic — user domain split by responsibility
                   #   (authService, passwordResetService, profileService,
                   #   verificationService, friendService, friendNotifications,
                   #   activityService, markerService, adminService, ...)
    constants/     # shared vocabularies (friendship status/edge/action)
    middleware/    # auth, adminAuth, userOrAdmin, jwt (Bearer parse +
                   #   session-freshness), rateLimit, sanitize, handle
    models/        # Mongoose schemas (User, Waitlist, MapMarkers, Location,
                   #   FriendRequest, EmailVerification)
    utils/         # validate, email, token (JWT sign/verify seam),
                   #   markerGeometry, names, httpError
frontend/
  src/
    pages/         # route components (Home, Login, Signup, ForgotPassword, Profile,
                   #   Dashboard, AdminDashboard, Admin, UserProfile, PrivacyPolicy,
                   #   Contact, ...)
    components/    # shared UI (AuthShell, Modal, PasswordInput, PasswordChecklist,
                   #   CodeVerifyStep, LogoMark, FieldLabel, ConfirmModal, Nav, ...)
    auth/          # route guards
    features/map/      # Leaflet map split by concern (MapView, MapCard, mapStyle,
                       #   geo, region, mapComponents), discovery gauge (discovery,
                       #   useDiscovery, DiscoveryPanel), render quality (mapQuality),
                       #   base style (basemap)
    features/location/ # geolocation + passive tracking (useGeolocation, createStore,
                       #   backgroundTracking, LocationTrackingPanel, WebTrackingNotice)
    features/users/    # user search, useUser, friends (FriendButton, FriendsListModal,
                       #   useProfileFriends), notifications (NotificationBell,
                       #   useNotifications, activityRenderers), ProfileToolbar
    features/settings/ # settings modal + per-device stores (SettingsModal,
                       #   DisplaySettings, createSetting, reduceMotion)
    features/badges/   # badges modal + carousel (BadgesModal, Badge) and a
                       #   category registry (categories/: accountAge, countries,
                       #   statesUS) — add a category = a new file + one line
    features/admin/    # waitlist + users tables and their hooks (usePagination)
    utils/         # validateName, fullName, passwordRules, csv, formatDate, retry,
                   #   useForm, useAsync, useDismiss, useDebouncedCallback
    assets/        # static assets (state-flags/ — US state/territory SVGs)
    api/client.js  # single API layer + session/token helpers (only file touching storage)
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

Approval emails (on waitlist approval), signup/reset verification codes, friend‑request and friend‑accepted notifications, and contact‑form submissions are all sent through the Brevo transactional API (a single `sendEmail` seam behind a shared branded template).

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

- **Authentication** — JWT for users and admins (HS256 pinned on both sign and verify, in a single token seam); protected routes require a valid token, and profile edits require ownership (or admin)
- **Session revocation** — user tokens carry a `tv` claim checked against the account's `tokenVersion` on every authenticated request; a password reset bumps the version, invalidating every previously‑issued token (including a stolen one) while returning a fresh token so the resetting client stays signed in
- **Email verification** — signup and password reset require a 6‑char code emailed to the address, enforced **server‑side** (bcrypt‑hashed at rest, 30‑min TTL, 5‑attempt cap via atomic `$inc`, resend cooldown); skipping the verify UI still fails. Ineligible emails get a uniform response (no enumeration)
- **Admin auth** — the admin password is validated server‑side in constant time; the panel uses a signed admin JWT, never a client‑side password check. The client‑side admin flag is cosmetic — every admin route still verifies the admin JWT
- **Authorization** — per‑user markers and location history are gated to the **owner, an admin, or one of the owner's friends** (not any signed‑in user); friend‑request responses are restricted to the recipient; profile edits enforce ownership in the service layer
- **Rate limiting** — a general API limiter, a strict limiter on login/registration/admin‑login, a cap on verification‑code requests, a friend‑request limiter (30/hour), and a dedicated cap on the public contact form
- **CORS allowlist** — restricted to known origins (configurable via `ALLOWED_ORIGINS`), plus localhost (dev), `capacitor://localhost` (iOS), and this project's Vercel deploys (matched by project slug — not any `*.vercel.app`)
- **Security headers** — Helmet, with JSON body-size caps (100 kb globally; a larger 4 MB limit only on the marker‑save routes, which carry the full points array)
- **Input validation** — length limits, name character rules, email‑format checks, a 4‑digit DOB/18+ check, and a password policy (≥12 chars with mixed character classes) all enforced server‑side
- **NoSQL injection hardening** — request bodies are scrubbed of Mongo operators (`$…`), dotted keys, and prototype‑pollution keys (`__proto__`/`constructor`/`prototype`); query values are normalized to strings
- **Credential exposure** — the bcrypt `passwordHash` is `select: false`, so it's excluded from queries by default and only the login path opts it in
- **CSV‑injection‑safe export** — the waitlist CSV escapes quotes and neutralizes formula triggers (`= + - @`)
- **Email‑enumeration hardening** — the public waitlist check collapses to `approved` / `unavailable`, and the join endpoint gives one indistinguishable response for already‑registered vs. already‑waitlisted, so neither reveals whether an email has an account; login timing is equalized for the same reason
- **Privacy** — date of birth is returned only to the profile owner or an admin; secrets live in `backend/.env` (gitignored)

> Note: set `ALLOWED_ORIGINS` and a strong `ADMIN_PASSWORD` in your production host (e.g. Render) before deploying. Because the admin password is the single factor that mints an admin token, keep both `ADMIN_PASSWORD` and `JWT_SECRET` strong.
