# Imprint

Imprint maps every place you've ever been. What began as a waitlist landing page is now a full application: waitlist‑gated accounts, user profiles, and an interactive world map where each user drops markers for the places they've visited — available on the web and as a native iOS app.

## Stack

- **Frontend** — React + Vite, React Router, React‑Leaflet (maps), lucide‑react (icons)
- **Mobile** — iOS app via Capacitor (wraps the web build)
- **Backend** — Node.js + Express 5, structured into routes → services → models
- **Database** — MongoDB via Mongoose
- **Email** — Brevo (Sendinblue) transactional API for approval emails
- **Auth** — JWT for users and admins; bcrypt password hashing
- **Deployment** — Frontend on Vercel, backend on Render

## Features

- **Waitlist** — public signup; admins approve entries, which triggers an approval email
- **Accounts** — registration is gated to approved waitlist emails; passwords are hashed with bcrypt
- **Profiles** — username, first/last name, and an 18+ date‑of‑birth gate set during onboarding
- **Interactive map** — a Leaflet map where users place per‑user markers; zoom‑aware region labels (city → county → state → country → continent → Earth) via reverse geocoding
- **Public profiles & search** — look up other users by username and view their profiles
- **Admin dashboard** — password‑protected (server‑side) panel to manage the waitlist and edit any user's map/profile
- **Mobile app** — the same experience packaged for iOS through Capacitor

## Project structure

```
backend/
  src/
    routes/        # thin HTTP handlers (admin, users, waitlist, markers)
    services/      # business logic (userService, waitlistService, markerService)
    middleware/    # auth, adminAuth, userOrAdmin, optionalAuth, rateLimit, sanitize, handle
    models/        # Mongoose schemas (User, Waitlist, MapMarkers)
    utils/         # validate, email
frontend/
  src/
    pages/         # route components (Home, Login, Signup, Profile, Dashboard, ...)
    components/    # shared UI (Spinner, ConfirmModal, LogoutModal, AdminLogoutModal, ...)
    auth/          # route guards
    features/map/  # shared Leaflet utilities
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
# capacitor://localhost, and *.vercel.app are always allowed.
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

Approval emails are sent through the Brevo transactional API.

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

Some behaviors are intentionally platform‑specific (e.g. the search bar position and the "locate me" button), gated via `Capacitor.isNativePlatform()`.

## Admin dashboard

Open the **Admin** link in the site footer (web only) and enter `ADMIN_PASSWORD`. Authentication is verified **server‑side**, which returns a short‑lived admin JWT used for all admin API calls. From the dashboard you can approve/reorder/delete waitlist entries, view registered users (with name and date of birth), and edit any user's map or profile.

## Security

The backend enforces security server‑side (not just in the UI):

- **Authentication** — JWT for users and admins; protected routes require a valid token, and profile edits require ownership (or admin)
- **Admin auth** — the admin password is validated server‑side; the panel uses a signed admin JWT, never a client‑side password check
- **Rate limiting** — a general API limiter plus a strict limiter on login/registration/admin‑login endpoints
- **CORS allowlist** — restricted to known origins (configurable via `ALLOWED_ORIGINS`), plus localhost (dev), `capacitor://localhost` (iOS), and `*.vercel.app`
- **Security headers** — Helmet, with a capped JSON body size
- **Input validation** — length limits, name character rules, a 4‑digit DOB/18+ check, and a password policy (≥12 chars with mixed character classes) all enforced server‑side
- **NoSQL injection hardening** — request bodies are scrubbed of Mongo operators (`$…`) and dotted keys
- **Privacy** — date of birth is returned only to the profile owner or an admin; secrets live in `backend/.env` (gitignored)

> Note: set `ALLOWED_ORIGINS` and a strong `ADMIN_PASSWORD` in your production host (e.g. Render) before deploying.
