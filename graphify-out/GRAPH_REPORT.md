# Graph Report - .  (2026-06-24)

## Corpus Check
- 139 files · ~56,872 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1094 nodes · 3019 edges · 68 communities (53 shown, 15 thin omitted)
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 523 edges (avg confidence: 0.8)
- Token cost: 336,459 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Minified Bundle Internals|Minified Bundle Internals]]
- [[_COMMUNITY_Discovery % Geometry Engine|Discovery % Geometry Engine]]
- [[_COMMUNITY_Minified Bundle Internals|Minified Bundle Internals]]
- [[_COMMUNITY_Minified Bundle Internals|Minified Bundle Internals]]
- [[_COMMUNITY_Capacitor Plugin Bridge Internals|Capacitor Plugin Bridge Internals]]
- [[_COMMUNITY_Minified Bundle Internals|Minified Bundle Internals]]
- [[_COMMUNITY_User Service & Validation|User Service & Validation]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Auth & Authorization Model|Auth & Authorization Model]]
- [[_COMMUNITY_Marker Storage & Routes|Marker Storage & Routes]]
- [[_COMMUNITY_Minified Bundle Internals|Minified Bundle Internals]]
- [[_COMMUNITY_Passive Background Tracking|Passive Background Tracking]]
- [[_COMMUNITY_Route Guards & Session Helpers|Route Guards & Session Helpers]]
- [[_COMMUNITY_Minified Bundle Internals|Minified Bundle Internals]]
- [[_COMMUNITY_Minified Bundle Internals|Minified Bundle Internals]]
- [[_COMMUNITY_Dual JWT Auth Implementation|Dual JWT Auth Implementation]]
- [[_COMMUNITY_iOS AppDelegate Lifecycle|iOS AppDelegate Lifecycle]]
- [[_COMMUNITY_Dashboard UI Components|Dashboard UI Components]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Express App Bootstrap|Express App Bootstrap]]
- [[_COMMUNITY_Minified Bundle Internals|Minified Bundle Internals]]
- [[_COMMUNITY_API Client Layer|API Client Layer]]
- [[_COMMUNITY_Landing Page Sections|Landing Page Sections]]
- [[_COMMUNITY_Minified Bundle Internals|Minified Bundle Internals]]
- [[_COMMUNITY_Waitlist Feature|Waitlist Feature]]
- [[_COMMUNITY_Profile Editing Flow|Profile Editing Flow]]
- [[_COMMUNITY_Rate Limiting Middleware|Rate Limiting Middleware]]
- [[_COMMUNITY_Contact Form Feature|Contact Form Feature]]
- [[_COMMUNITY_Mongoose Data Models|Mongoose Data Models]]
- [[_COMMUNITY_Admin Tables & Hooks|Admin Tables & Hooks]]
- [[_COMMUNITY_Map UI Components|Map UI Components]]
- [[_COMMUNITY_Location Ingestion Pipeline|Location Ingestion Pipeline]]
- [[_COMMUNITY_Product Feature Inventory|Product Feature Inventory]]
- [[_COMMUNITY_Discovery Gauge Feature|Discovery Gauge Feature]]
- [[_COMMUNITY_Auth Screens & Shell|Auth Screens & Shell]]
- [[_COMMUNITY_Marker Spacing & Thinning|Marker Spacing & Thinning]]
- [[_COMMUNITY_Greeting Widget|Greeting Widget]]
- [[_COMMUNITY_Minified Bundle Internals|Minified Bundle Internals]]
- [[_COMMUNITY_Single API Layer Design|Single API Layer Design]]
- [[_COMMUNITY_Landing Page Aspirational Features|Landing Page Aspirational Features]]
- [[_COMMUNITY_Root Orchestration Scripts|Root Orchestration Scripts]]
- [[_COMMUNITY_Capacitor iOS Wrapper|Capacitor iOS Wrapper]]
- [[_COMMUNITY_Cold-Start Resilience Strategy|Cold-Start Resilience Strategy]]
- [[_COMMUNITY_Map & Tracking Feature Set|Map & Tracking Feature Set]]
- [[_COMMUNITY_ViteReact Tooling Notes|Vite/React Tooling Notes]]
- [[_COMMUNITY_Profile-Edit Cooldown Logic|Profile-Edit Cooldown Logic]]
- [[_COMMUNITY_Accounts & Waitlist Features|Accounts & Waitlist Features]]
- [[_COMMUNITY_Vercel Build Config|Vercel Build Config]]
- [[_COMMUNITY_Vercel Rewrites Config|Vercel Rewrites Config]]
- [[_COMMUNITY_Git Workflow Conventions|Git Workflow Conventions]]
- [[_COMMUNITY_iOS App Icon Asset|iOS App Icon Asset]]
- [[_COMMUNITY_Hero Illustration Asset|Hero Illustration Asset]]
- [[_COMMUNITY_React Logo Asset|React Logo Asset]]
- [[_COMMUNITY_CLAUDE.md Guidance Doc|CLAUDE.md Guidance Doc]]
- [[_COMMUNITY_Commit Style Convention|Commit Style Convention]]
- [[_COMMUNITY_No Test Suite Note|No Test Suite Note]]
- [[_COMMUNITY_userOrAdmin Middleware|userOrAdmin Middleware]]
- [[_COMMUNITY_Favicon Asset|Favicon Asset]]
- [[_COMMUNITY_Icon Sprite Sheet Asset|Icon Sprite Sheet Asset]]
- [[_COMMUNITY_Splash Screen Asset|Splash Screen Asset]]
- [[_COMMUNITY_iOS Splash Logo Asset|iOS Splash Logo Asset]]
- [[_COMMUNITY_Splash Screen Variant Asset|Splash Screen Variant Asset]]

## God Nodes (most connected - your core abstractions)
1. `$()` - 399 edges
2. `i()` - 69 edges
3. `dc()` - 54 edges
4. `n()` - 44 edges
5. `F()` - 39 edges
6. `c()` - 31 edges
7. `pc()` - 30 edges
8. `bt()` - 28 edges
9. `fc()` - 28 edges
10. `wu()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `Landing feature: Coverage Map (heat map)` --semantically_similar_to--> `Interactive map feature (per-user markers, region labels)`  [INFERRED] [semantically similar]
  index.html → README.md
- `Landing feature: Coverage Map (heat map)` --semantically_similar_to--> `Discovery gauge feature (% region discovered radial gauge)`  [INFERRED] [semantically similar]
  index.html → README.md
- `Landing feature: Passive Tracking` --semantically_similar_to--> `Passive tracking feature (mobile background location)`  [INFERRED] [semantically similar]
  index.html → README.md
- `frontend/index.html (Vite app shell)` --conceptually_related_to--> `Imprint app (travel-coverage mapping product)`  [INFERRED]
  frontend/index.html → README.md
- `/Users/jiahaoli/imprint/index.html (marketing landing page)` --conceptually_related_to--> `Imprint app (travel-coverage mapping product)`  [INFERRED]
  index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Backend auth & authorization flow (two JWTs, middleware, cosmetic flag, server-side enforcement)** — imprint_claude_md_two_jwts, adminservice_login, middleware_auth, middleware_adminauth, middleware_userOrAdmin, imprint_claude_md_admin_auth_flag, imprint_claude_md_mutually_exclusive_sessions [EXTRACTED 0.95]
- **Passive tracking -> raw Location storage -> marker thinning pipeline** — backgroundtracking_js, locationservice_index, model_location, markerservice_addmarkersfrompoints, thinpoints_helper, model_mapmarkers, imprint_claude_md_marker_spacing_m [EXTRACTED 0.95]
- **Map region label + discovery gauge consistency (shared place-naming helpers)** — maputils_js_regiondetector, maputils_js_continentcontaining, maputils_js_oceanat, discovery_js, discovery_js_usediscovery, discoverysettletracker [EXTRACTED 0.95]

## Communities (68 total, 15 thin omitted)

### Community 0 - "Minified Bundle Internals"
Cohesion: 0.06
Nodes (87): ad(), an(), ar(), at(), be(), bn(), bt(), ce() (+79 more)

### Community 1 - "Discovery % Geometry Engine"
Cohesion: 0.06
Nodes (41): getStoredMapQuality(), setStoredMapQuality(), bboxesFor(), cacheGeometry(), computeDiscovery(), fetchRegionGeometry(), geometryCache, LEVEL_NOMINATIM_ZOOM (+33 more)

### Community 2 - "Minified Bundle Internals"
Cohesion: 0.11
Nodes (49): ac(), ai(), bc(), bi(), c(), cc(), ci(), Co() (+41 more)

### Community 3 - "Minified Bundle Internals"
Cohesion: 0.10
Nodes (48): a(), ae(), Au(), bd(), bl(), bu(), cd(), cl() (+40 more)

### Community 4 - "Capacitor Plugin Bridge Internals"
Cohesion: 0.06
Nodes (27): $(), addListener(), addWindowListener(), br(), cf(), clearAllCookies(), clearCookies(), Cr() (+19 more)

### Community 5 - "Minified Bundle Internals"
Cohesion: 0.13
Nodes (37): af(), Al(), bf(), df(), dl(), ef(), ff(), fl() (+29 more)

### Community 6 - "User Service & Validation"
Cohesion: 0.14
Nodes (34): ageFromDob(), bcrypt, {
  checkLength, checkPassword, checkRequired,
  normalizeEmail, normalizeUsername, validateName, validateUsername, cleanName,
  COOLDOWN_DAYS, daysUntil,
}, checkUsername(), DUMMY_HASH, getProfileFor(), getUserByUsername(), httpError (+26 more)

### Community 7 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, @capacitor/cli, @capacitor-community/background-geolocation, @capacitor/core, @capacitor/ios, leaflet, lucide-react, react (+24 more)

### Community 8 - "Auth & Authorization Model"
Cohesion: 0.07
Nodes (29): admin_auth sessionStorage flag (cosmetic UI gating only), handle() async wrapper middleware, httpError(status, msg), Dedicated 4mb body parser for /api/markers, User and admin sessions mutually exclusive on client, Routes -> Services -> Models layering (keep routes thin), backend/src/index.js (central error handler & body parsers), Imprint root README (+21 more)

### Community 9 - "Marker Storage & Routes"
Cohesion: 0.09
Nodes (25): mapMarkersSchema, { Schema, model }, { getAdminMarkers, getUserMarkers, saveUserMarkers, saveUserMarkersByUsername }, handle, requireAdminAuth, requireAuth, requireUserOrAdmin, router (+17 more)

### Community 10 - "Minified Bundle Internals"
Cohesion: 0.12
Nodes (29): as(), ba(), bs(), d(), Da(), ei(), go(), i() (+21 more)

### Community 11 - "Passive Background Tracking"
Cohesion: 0.15
Nodes (23): buffer, flush(), getAuthorizationStatus(), getStatus(), isNative, isTracking(), isTrackingSupported(), openLocationSettings() (+15 more)

### Community 12 - "Route Guards & Session Helpers"
Cohesion: 0.17
Nodes (18): getUsername(), isAdminAuthed(), CatchAll(), isNative, OwnDashboardOnly(), RequireAdminAuth(), RequireAuth(), RequireAuthOrAdmin() (+10 more)

### Community 13 - "Minified Bundle Internals"
Cohesion: 0.17
Nodes (27): Ao(), bo(), cs(), Do(), eo(), es(), Fo(), Ho() (+19 more)

### Community 14 - "Minified Bundle Internals"
Cohesion: 0.11
Nodes (26): ap(), delete(), dp(), ep(), fp(), ip(), jp(), kp() (+18 more)

### Community 15 - "Dual JWT Auth Implementation"
Cohesion: 0.11
Nodes (20): adminService POST /api/admin/login (constant-time compare), Two independent JWTs (user token, admin token), { readBearer, isAdminToken }, { readBearer, isAdminToken }, assignIdentity(), isAdminToken(), jwt, readBearer() (+12 more)

### Community 16 - "iOS AppDelegate Lifecycle"
Cohesion: 0.10
Nodes (17): Any, AppDelegate, Bool, Capacitor, NSKeyValueObservation, NSUserActivity, UIApplication, UIApplicationDelegate (+9 more)

### Community 17 - "Dashboard UI Components"
Cohesion: 0.14
Nodes (18): markersApiFor(), profileApiFor(), AdminViewingBadge(), LogoutButton(), LogoutModal(), useGeolocation(), WebTrackingNotice(), DiscoveryPanel() (+10 more)

### Community 18 - "Backend Dependencies"
Cohesion: 0.08
Nodes (25): author, dependencies, bcryptjs, cors, dotenv, express, express-rate-limit, helmet (+17 more)

### Community 19 - "Express App Bootstrap"
Cohesion: 0.09
Nodes (20): mongoose, adminRoutes, allowedOrigins, { apiLimiter }, app, connectDB, contactRoutes, cors (+12 more)

### Community 20 - "Minified Bundle Internals"
Cohesion: 0.19
Nodes (21): componentDidCatch(), di(), F(), fs(), Ia(), ii(), js(), ks() (+13 more)

### Community 21 - "API Client Layer"
Cohesion: 0.15
Nodes (10): adminRequest, clearAdminSession(), clearSession(), request, setAdminToken(), setToken(), AdminLoginModal(), Footer() (+2 more)

### Community 22 - "Landing Page Sections"
Cohesion: 0.14
Nodes (11): CTA(), Features, Hero(), HowItWorks(), steps, MapMockup(), isNative, Nav() (+3 more)

### Community 23 - "Minified Bundle Internals"
Cohesion: 0.18
Nodes (18): Aa(), b(), ds(), E(), fc(), fe(), Hi(), ic() (+10 more)

### Community 24 - "Waitlist Feature"
Cohesion: 0.16
Nodes (16): { authLimiter }, handle, { joinWaitlist, listWaitlist, countWaitlist, checkWaitlist, reorderWaitlist, approveEntry, deleteEntry }, requireAdminAuth, router, approveEntry(), { checkLength, checkRequired, checkEmail, normalizeEmail }, countWaitlist() (+8 more)

### Community 25 - "Profile Editing Flow"
Cohesion: 0.18
Nodes (11): setUsername(), maxDob, Profile(), useProfileEdit(), isNative, UserSearch(), COOLDOWN_DAYS, daysUntil() (+3 more)

### Community 26 - "Rate Limiting Middleware"
Cohesion: 0.15
Nodes (13): apiLimiter, authLimiter, rateLimit, { authLimiter }, handle, { login }, router, Security: Rate limiting (+5 more)

### Community 27 - "Contact Form Feature"
Cohesion: 0.18
Nodes (14): contactLimiter, { contactLimiter }, handle, router, { submitContact }, { checkLength, checkEmail }, httpError, { sendContactEmail } (+6 more)

### Community 28 - "Mongoose Data Models"
Cohesion: 0.12
Nodes (13): locationSchema, { Schema, model }, { LIMITS }, { Schema, model }, userSchema, { LIMITS }, { Schema, model }, waitlistSchema (+5 more)

### Community 29 - "Admin Tables & Hooks"
Cohesion: 0.24
Nodes (8): useDragReorder(), UsersTable(), useUsers(), useWaitlist(), WaitlistTable(), Admin(), formatDate(), matchesQuery()

### Community 30 - "Map UI Components"
Cohesion: 0.20
Nodes (9): AppHeader(), ConfirmModal(), SaveMapPrompt(), useMarkers(), AdminDashboard(), isNative, retry(), sleep() (+1 more)

### Community 31 - "Location Ingestion Pipeline"
Cohesion: 0.17
Nodes (13): handle, { logLocations }, requireAuth, router, { addMarkersFromPoints }, buildLocationDocs(), httpError, { isValidLocationPoint } (+5 more)

### Community 32 - "Product Feature Inventory"
Cohesion: 0.13
Nodes (15): Brevo (Sendinblue) transactional email API, Node.js + Express 5 backend, Admin dashboard feature, Enlarge map feature (web-only toggle), Locate me feature (one-shot location control), Mobile app feature (iOS via Capacitor), Privacy Policy & Contact pages, Profiles feature (username, name, DOB 18+ gate) (+7 more)

### Community 33 - "Discovery Gauge Feature"
Cohesion: 0.14
Nodes (15): frontend/src/features/map/discovery.js, useDiscovery hook, DiscoverySettleTracker, MAX_RENDERED_PINS cap, Discovery % render-only decoupling rationale, TARGET_CELLS per level (scale-invariant grid), frontend/src/features/map/mapQuality.js (Map Quality tier setting), frontend/src/features/map/mapUtils.js (+7 more)

### Community 34 - "Auth Screens & Shell"
Cohesion: 0.27
Nodes (8): api, AuthShell(), isNative, Contact(), Login(), PW_RULES, Signup(), isValidEmail()

### Community 35 - "Marker Spacing & Thinning"
Cohesion: 0.18
Nodes (11): frontend/src/features/location/backgroundTracking.js, frontend/src/features/location/createStore.js (module-level observable stores), Capacitor.isNativePlatform() gating, MARKER_RADIUS_M constant (15.24m render radius), MARKER_SPACING_M constant (100m), backend/src/services/locationService.js, markers:respace migration script, markerService.addMarkersFromPoints (+3 more)

### Community 36 - "Greeting Widget"
Cohesion: 0.33
Nodes (6): Greeting(), WaveText(), getGreeting(), GREETINGS, refreshGreeting(), useFitText()

### Community 37 - "Minified Bundle Internals"
Cohesion: 0.31
Nodes (9): ca(), fu(), gs(), Nu(), pu(), S(), Su(), te() (+1 more)

### Community 38 - "Single API Layer Design"
Cohesion: 0.28
Nodes (9): adminRequest() (admin token requests), frontend/src/api/client.js (single API layer), clearAdminSession helper, getUsername helper, isAdminAuthed helper, markersApiFor(isAdminView, username), profileApiFor(isAdminView), request() (user token requests) (+1 more)

### Community 39 - "Landing Page Aspirational Features"
Cohesion: 0.22
Nodes (9): Landing feature: Achievements & Milestones (not in actual app feature list), Landing feature: Bucket List (not in actual app feature list), Landing feature: Friend Comparisons (not in actual app feature list), Landing feature: Trip Recaps (not in actual app feature list), Hero section (headline, map mockup, CTA), How it works section (4-step onboarding flow), Static SVG/CSS world-map mockup (coverage % visual), Stats row (195 countries, 510M km², infinity stories) (+1 more)

### Community 40 - "Root Orchestration Scripts"
Cohesion: 0.22
Nodes (8): devDependencies, concurrently, name, private, scripts, dev, dev:backend, dev:frontend

### Community 41 - "Capacitor iOS Wrapper"
Cohesion: 0.25
Nodes (7): @capacitor-community/background-geolocation, Capacitor 7 iOS app wrapper, CapApp-SPM README (SPM dependency host package), frontend/index.html (Vite app shell), frontend/src/main.jsx (React entry point), frontend/ios/App/App/public/index.html (built iOS web shell), PackageDescription

### Community 42 - "Cold-Start Resilience Strategy"
Cohesion: 0.25
Nodes (8): GitHub Actions cron (tried, too sparse, abandoned), Cold-start resilience (Render free tier), Deployment: frontend Vercel, backend Render, Render (backend deployment, free tier), frontend/src/utils/retry.js, UptimeRobot external uptime monitor, useMarkers hook, useUser hook

### Community 43 - "Map & Tracking Feature Set"
Cohesion: 0.40
Nodes (6): Discovery gauge feature (% region discovered radial gauge), Interactive map feature (per-user markers, region labels), Map Quality feature (Low-Max device setting), Passive tracking feature (mobile background location), Landing feature: Coverage Map (heat map), Landing feature: Passive Tracking

### Community 44 - "Vite/React Tooling Notes"
Cohesion: 0.33
Nodes (6): frontend/README.md (React + Vite template doc), React Compiler (not enabled, perf impact), React + Vite frontend stack, typescript-eslint (type-aware lint rules), @vitejs/plugin-react (uses Oxc), @vitejs/plugin-react-swc (uses SWC)

### Community 45 - "Profile-Edit Cooldown Logic"
Cohesion: 0.33
Nodes (6): Admins bypass cooldown and never write timestamp stamps, Profile-edit cooldowns (username 30d, name 7d), backend/src/services/userService.js, COOLDOWN_DAYS, daysUntil, validateUsername

### Community 46 - "Accounts & Waitlist Features"
Cohesion: 0.67
Nodes (3): Accounts feature (gated registration, bcrypt), Waitlist feature (public signup + admin approval), CTA section (waitlist join, app store badges)

## Knowledge Gaps
- **254 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+249 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$()` connect `Capacitor Plugin Bridge Internals` to `Minified Bundle Internals`, `Minified Bundle Internals`, `Minified Bundle Internals`, `Minified Bundle Internals`, `Minified Bundle Internals`, `Minified Bundle Internals`, `Minified Bundle Internals`, `Minified Bundle Internals`, `Minified Bundle Internals`, `Minified Bundle Internals`?**
  _High betweenness centrality (0.297) - this node is a cross-community bridge._
- **Why does `Fn()` connect `Minified Bundle Internals` to `Capacitor Plugin Bridge Internals`, `Map UI Components`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Why does `retry()` connect `Map UI Components` to `Minified Bundle Internals`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `i()` (e.g. with `he()` and `r()`) actually correct?**
  _`i()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `dc()` (e.g. with `af()` and `ci()`) actually correct?**
  _`dc()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `n()` (e.g. with `E()` and `et()`) actually correct?**
  _`n()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `F()` (e.g. with `b()` and `ct()`) actually correct?**
  _`F()` has 5 INFERRED edges - model-reasoned connections that need verification._