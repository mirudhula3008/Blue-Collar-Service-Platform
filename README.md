# 🔧 FixIT

**Skilled hands. Trusted work. Right nearby.**

FixIT is a hyperlocal, on-demand platform that connects people with **verified blue-collar workers near
them**: plumbers, electricians, carpenters, painters, cleaners, appliance technicians, mechanics, car and
bike wash, and vehicle rental. Customers see nearby workers on a map with **transparent prices and real
reviews**, book a time slot, pay, and rate the job. Workers get bookings from their neighbourhood, set
their own (optionally negotiable) prices and track their earnings. Admins verify workers and keep the
platform safe.

Built for the **Vecnaverse National Level Hackathon 2026** (Problem Statement 3, Social Impact).
The whole app works in **English, Tamil (தமிழ்), Hindi (हिन्दी) and Bengali (বাংলা)**.

---

## Contents

1. [Features](#1-features)
2. [Demo accounts](#2-demo-accounts)
3. [Tech stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Project structure](#5-project-structure)
6. [Getting started](#6-getting-started)
7. [Configuration](#7-configuration)
8. [How it works](#8-how-it-works)
9. [Data models](#9-data-models)
10. [API reference](#10-api-reference)
11. [Languages (i18n)](#11-languages-i18n)
12. [Design system](#12-design-system)
13. [Security](#13-security)
14. [Deployment](#14-deployment)
15. [Demo script](#15-demo-script)
16. [Troubleshooting](#16-troubleshooting)
17. [Team and modules](#17-team-and-modules)
18. [Limitations and future work](#18-limitations-and-future-work)

---

## 1. Features

### For customers
- **10 service categories:** plumbing, electrical, carpentry, painting, cleaning, appliance repair,
  vehicle rental, car wash, bike wash and mechanic.
- **Find workers near you** on an OpenStreetMap map and in a list, nearest first. Results show the
  distance, rating, price range, availability and a *Negotiable* badge.
- **Filters and sorting:** distance (1–50 km), maximum price, minimum rating and *available now*.
  Sort by nearest, top rated, or price low/high.
- **Location:** starts in Chennai by default. Switch on *Use live location* to follow your phone's GPS;
  results update as you move.
- **Worker profiles:** services with prices, experience, a rating summary with a 1–5★ breakdown, reviews
  and a map.
- **Booking:** choose a service, pick a date (next 14 days) and a 30-minute slot, describe the job, and
  offer your own price if the worker is negotiable.
- **Payment (simulated):** UPI, card, wallet or cash. A transaction ID is issued, and payments are
  refunded automatically if the booking is declined or cancelled.
- **My bookings:** Active / Completed / Cancelled tabs, *Pay now*, *Cancel*, and *Leave a review* once a
  job is done.

### For workers (service providers)
- **Sign up** with a service category, location, services and prices, and an ID proof upload.
- **Profile:** edit services and prices (per job, hour, day, sq ft or visit), and toggle *Available* and
  *Negotiable*.
- **Incoming requests:** see each request with the job location on a map, then Accept or Decline. The list
  refreshes every 15 seconds.
- **My jobs:** start and complete jobs, and see past jobs.
- **Earnings dashboard:** today, this week, this month and lifetime take-home pay (after the 10% platform
  commission), pending payouts, a 7-day / 4-week / 6-month chart, and a transaction list.
- **Reviews:** a read-only list of what customers said.
- Phone numbers are shared between customer and worker **only after the booking is accepted**.

### For admins
- **Dashboard:** users, workers by status, bookings, revenue, commission, today's activity, pending ID
  verifications, jobs awaiting review, and recent account actions.
- **Worker management:** set a worker to *active*, *under review*, *suspended* or *blocked*. Every change:
  - needs a **reason of at least 10 characters**, with optional evidence (links or uploaded photos)
  - is saved in an **append-only history** of who did it and why
  - for *suspended* or *blocked*, **cancels the worker's pending and accepted bookings and refunds them**
- **Verification:** view uploaded ID proofs, and verify or unverify workers. Only verified, active workers
  appear in search.
- **Customers and bookings:** searchable, filterable lists.

### Platform-wide
- **4 languages** on every page, including dates, times and common server messages.
- **Responsive design** for phones, tablets and desktops.
- **Role-based access:** customers, workers and admins each see only their own pages and data.

---

## 2. Demo accounts

Created by the seed scripts (see [Getting started](#6-getting-started)).

| Role | Email | Password |
|---|---|---|
| Admin | `admin@seed.local` | `admin123` |
| Customer | `arun.prasad@seed.local` | `password123` |
| Customer | `divya.shankar@seed.local`, `harish.venkat@seed.local` | `password123` |
| Worker (plumber, negotiable) | `ravi.kumar@seed.local` | `password123` |
| Worker (mechanic) | `muthu.kumar@seed.local` | `password123` |
| Worker (vehicle rental) | `venkatesh.iyer@seed.local` | `password123` |
| Worker (appliance repair) | `arjun.krishnan@seed.local` | `password123` |

All 31 sample workers follow the pattern `firstname.lastname@seed.local` with `password123`. They are
spread across Chennai (T. Nagar, Adyar, Velachery, Guindy, Porur, Tambaram and more), 3–4 per category.
A few are marked *Busy* so you can see that state.

**Test payment card:** `4000 0000 0000 0002` is always declined. Any other valid-looking card succeeds.

---

## 3. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 3, Lucide icons |
| Maps | Leaflet + react-leaflet, OpenStreetMap tiles (free, no API key) |
| Backend | Node.js 18+, Express 4 |
| Database | MongoDB with Mongoose 8 (2dsphere geospatial index, aggregation pipelines) |
| Auth | JWT (jsonwebtoken) + bcryptjs password hashing |
| File uploads | Multer + Cloudinary (falls back to local disk when Cloudinary isn't configured) |
| Languages | Custom React Context + JSON locale files (no i18n library) |
| Fonts | DM Sans, Instrument Serif, Noto Sans Tamil / Devanagari / Bengali |
| Hosting (suggested) | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

---

## 4. Architecture

```
┌──────────────────────────┐        /api/*  (JSON, JWT in Authorization header)
│  React SPA (Vite)        │ ─────────────────────────────────────────────┐
│  localhost:5173          │                                               ▼
│                          │                              ┌──────────────────────────────┐
│  pages/      screens     │                              │  Express API  (localhost:5000)│
│  components/ UI pieces   │                              │                              │
│  context/    Auth, i18n  │                              │  routes/ → controllers/      │
│  api/        axios calls │                              │  middleware/ protect,        │
│  locales/    en ta hi bn │                              │    authorize, upload, errors │
└──────────────────────────┘                              │  utils/ storage, refunds,    │
            ▲                                             │    validation, ratings       │
            │ map tiles                                   └──────────────┬───────────────┘
   ┌────────┴─────────┐                                                  │ Mongoose
   │  OpenStreetMap   │                    ┌─────────────────────────────▼──────────────┐
   └──────────────────┘                    │ MongoDB: users · bookings · payments ·     │
                                           │          reviews   (users.location 2dsphere)│
                                           └────────────────────────────────────────────┘
                                                          Cloudinary (ID proofs, photos)
```

- In development, Vite proxies `/api` to the backend, so the browser talks to a single origin.
- In production, the frontend calls the backend directly using `VITE_API_URL`.
- Every protected request carries `Authorization: Bearer <token>`. The `protect` middleware loads the
  user, and `authorize('worker')` (etc.) checks the role.

---

## 5. Project structure

```
├── client/                       React frontend
│   ├── index.html                Fonts, title, favicon
│   ├── public/favicon.svg        Wrench logo icon
│   ├── vercel.json               SPA rewrite for Vercel
│   ├── tailwind.config.js        Theme colours, fonts, shadows
│   └── src/
│       ├── App.jsx               All routes, with role guards
│       ├── main.jsx              Providers: Language → Router → App (Auth inside)
│       ├── index.css             Design tokens, buttons, badges, cards, inputs
│       ├── api/                  axios client + one file per area
│       │   ├── client.js         Base URL, JWT header, translated errors
│       │   ├── serverMessages.js Maps English API messages to translation keys
│       │   └── auth · discovery · bookings · payments · earnings · reviews · admin
│       ├── context/
│       │   ├── AuthContext.jsx   Login/register/logout, user, saved language sync
│       │   └── LanguageContext.jsx  t(), changeLanguage(), locale for dates
│       ├── locales/              en.json, ta.json, hi.json, bn.json (same keys)
│       ├── hooks/                useGeolocation (Chennai default + live), usePolling
│       ├── components/           Navbar, LanguageSelector, WorkerMap, WorkerCard,
│       │                         FilterSidebar, DateTimePicker, BookingCard, StarRating,
│       │                         ReviewList, EarningsChart, AdminLayout, AdminUi, ...
│       ├── pages/                Landing, Login, Register, Profile, CustomerDashboard,
│       │                         WorkerListing, WorkerDetail, BookingForm, PaymentPage,
│       │                         MyBookings, ReviewPage, WorkerRequests, WorkerJobs,
│       │                         EarningsDashboard, WorkerReviews, Admin*
│       ├── data/categories.js    Category ids + icons (labels come from locales)
│       └── utils/                Formatting (prices, dates, distance), booking helpers
│
├── server/                       Express backend
│   ├── .env.example              All settings, documented
│   └── src/
│       ├── index.js              App setup and route mounting
│       ├── config/db.js          MongoDB connection
│       ├── models/               User, Booking, Payment, Review
│       ├── routes/               auth, users, upload, categories, workers, bookings,
│       │                         payments, earnings, reviews, admin
│       ├── controllers/          Business logic per area
│       ├── middleware/           auth (protect/authorize), upload (multer), error
│       ├── utils/                storage (Cloudinary/local), refunds, ratings,
│       │                         bookingStatus (state machine), validation, http
│       ├── data/categories.js    The 10 service categories
│       └── seed/                 seedWorkers, seedDemoActivity, seedAdmin
│
└── docs/                         Per-module notes from the original team split
```

---

## 6. Getting started

### Prerequisites
- **Node.js 18 or newer** (`node -v`)
- **MongoDB 6+** running locally, **or** a free MongoDB Atlas cluster

### 1. Clone
```bash
git clone https://github.com/mirudhula3008/Blue-Collar-Service-Platform.git
cd Blue-Collar-Service-Platform
```

### 2. Backend
```bash
cd server
cp .env.example .env        # Windows: copy .env.example .env
```
Open `server/.env`, set `MONGO_URI` (the default works with a local MongoDB) and change `JWT_SECRET` to
any long random string. Then:
```bash
npm install
npm run seed          # 31 workers across 10 categories, 3 customers, sample reviews
npm run seed:demo     # ~6 months of completed, paid jobs (fills earnings and admin charts)
npm run seed:admin    # admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev           # API on http://localhost:5000
```

### 3. Frontend (second terminal)
```bash
cd client
npm install
npm run dev           # app on http://localhost:5173
```

Open **http://localhost:5173** and log in with a [demo account](#2-demo-accounts).

> All seed scripts are safe to re-run. They update the sample accounts in place (matched by email), so
> existing bookings, payments and the admin account are never broken.

### npm scripts

| Where | Script | What it does |
|---|---|---|
| server | `npm run dev` | Start the API with auto-reload (nodemon) |
| server | `npm start` | Start the API (production) |
| server | `npm run seed` | Create or update sample workers, customers and reviews |
| server | `npm run seed:demo` | Replace the `[demo]` booking history with fresh data |
| server | `npm run seed:admin` | Create the admin account (or promote an existing one) |
| client | `npm run dev` | Start the website with hot reload |
| client | `npm run build` | Production build into `client/dist` |
| client | `npm run preview` | Serve the production build locally |

---

## 7. Configuration

### `server/.env`

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `PORT` | no | `5000` | API port |
| `MONGO_URI` | **yes** | `mongodb://127.0.0.1:27017/bluecollar` | Database connection |
| `CLIENT_URL` | yes in prod | `https://fixit.vercel.app` | Allowed CORS origin |
| `JWT_SECRET` | **yes** | long random string | Signs login tokens. The server refuses to start without it |
| `JWT_EXPIRES_IN` | no | `7d` | Login session length |
| `CLOUDINARY_CLOUD_NAME` | prod | | Cloud storage for ID proofs and photos |
| `CLOUDINARY_API_KEY` | prod | | |
| `CLOUDINARY_API_SECRET` | prod | | |
| `ADMIN_EMAIL` | no | `admin@seed.local` | Admin created by `seed:admin` |
| `ADMIN_PASSWORD` | no | `admin123` | **Change this for any public deployment** |

Without Cloudinary keys, uploads are stored in `server/uploads/` and served at `/uploads/...`. That's fine
locally, but hosts like Render wipe their disk on each deploy.

### `client/.env` (optional)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend URL in production (e.g. `https://fixit-api.onrender.com`). Leave empty in development. |

---

## 8. How it works

### 8.1 Customer journey
```
Landing → Sign up / Log in → Choose a category → Map + list of nearby workers
  → Worker profile → Book (service, date, slot, description, price offer)
  → Pay (UPI / card / wallet / cash) → My bookings → (job done) → Review
```

### 8.2 Worker journey
```
Sign up (category, location, services, ID proof) → Admin verifies → Appears in search
  → Incoming request → Accept / Decline → Start job → Complete → Earnings update
```

### 8.3 Booking lifecycle
```
            accept               start                complete
requested ──────────▶ accepted ──────────▶ in_progress ───────────▶ completed
    │                    │
    │ reject (worker)    │ cancel (customer)
    ▼                    ▼
 rejected            cancelled          cancelled_by_admin  ◀── worker suspended/blocked
```
- The rules live in `server/src/utils/bookingStatus.js`. Every change is checked against the current
  status **and** who owns the booking.
- Updates are conditional (`findOneAndUpdate` on the expected status), so a double click or two devices
  can't apply the same change twice.
- A customer can't double-book the same worker and time slot.

### 8.4 Finding nearby workers
- Each worker's `location` is a GeoJSON point with a **2dsphere index**.
- `GET /api/workers` runs a MongoDB `$geoNear` aggregation. It returns workers within the chosen radius,
  nearest first, with the exact distance, filtered by category, price, rating and availability.
- Only **verified** workers whose account status is **active** are returned.
- The browser starts at Chennai (13.0827, 80.2707). *Use live location* switches to the Geolocation API
  (`watchPosition`) and only refreshes results after moving more than 50 m.

### 8.5 Pricing
- Every worker lists services with a price and a unit (*per job, hour, day, sq ft, visit*).
- **Fixed-price** workers: the booking always uses the listed price.
- **Negotiable** workers: the customer can offer their own price, and the worker accepts or declines.
- The amount charged is always read from the booking **on the server**, never trusted from the browser.

### 8.6 Payments (simulated)
No real money moves; this is a hackathon demo.
1. `POST /api/payments` creates a *pending* payment with a transaction ID (`TXN…`).
2. `PATCH /api/payments/:id/process` waits 2 seconds (like a real gateway), then marks it *completed*
   and the booking as *paid*.
3. The test card `4000 0000 0000 0002` is declined, to demo failure handling.
4. Only the card **brand and last 4 digits** are stored. Full card numbers and CVVs never are.
5. Declined, cancelled or admin-cancelled bookings have their payment marked **refunded**.

### 8.7 Earnings and commission
- The platform keeps **10%** of each job, and the worker's take-home is the other 90%.
- A payment counts as earnings **only once the job is completed**. Money paid upfront for a future job
  is shown separately as *awaiting completion*.
- Day, week (Monday–Sunday) and month boundaries use Indian Standard Time.
- Payouts are marked *settled* 7 days after the job (simulated). *Pending payout* is the take-home pay
  not yet settled.

### 8.8 Reviews and ratings
- Only the customer of a **completed** booking can review it, and only once (`bookingId` is unique).
- After each review, the worker's `averageRating` and `totalReviews` are recalculated from all reviews.

### 8.9 Account control and verification (admin)
- New workers start **unverified** and are hidden from search until an admin verifies their ID proof.
  Uploading a new ID proof resets verification.
- `accountStatus` (active / under_review / suspended / blocked) controls whether a worker can be found
  and booked. Every change appends `{status, reason, evidence, changedBy, changedAt}` to `statusHistory`.
  This log is append-only and is never shown on public profiles.

---

## 9. Data models

### User
| Field | Notes |
|---|---|
| `name`, `email` (unique), `phone`, `password` | Password is bcrypt-hashed and never returned |
| `role` | `customer` · `worker` · `admin` |
| `profilePhoto`, `address` | |
| `location` | GeoJSON `{ type: 'Point', coordinates: [lng, lat] }`, 2dsphere index |
| `preferredLanguage` | `en` · `ta` · `hi` · `bn`, applied on login |
| `serviceCategory` | One of the 10 categories (workers) |
| `services[]` | `{ name, price, unit }` |
| `bio`, `experienceYears`, `isNegotiable`, `availability` | Worker settings |
| `idProofUrl`, `isVerified` | Verification |
| `averageRating`, `totalReviews` | Recalculated after each review |
| `accountStatus`, `statusHistory[]` | Admin control and audit log |

### Booking
`customerId`, `workerId`, `serviceCategory`, `serviceName`, `description`, `scheduledDate`,
`scheduledTime`, `agreedPrice`, `status` (see the lifecycle above), `customerLocation`, `completedAt`,
`paymentStatus` (`unpaid` · `paid` · `refunded`), `paymentMethod`, timestamps.

### Payment
`bookingId`, `customerId`, `workerId`, `amount`, `method` (`upi` · `card` · `wallet` · `cash`),
`status` (`pending` · `processing` · `completed` · `failed` · `refunded`), `transactionId`,
`methodDetails` (UPI ID / card brand and last 4 / wallet name), `settled`, `settledAt`, `completedAt`.

### Review
`bookingId` (unique), `customerId`, `workerId`, `rating` (1–5), `comment`, `createdAt`.

---

## 10. API reference

Base URL: `/api`. Errors are returned as `{ "message": "..." }` with a matching HTTP status.

🔓 public · 🔐 any logged-in user · 👤 customer · 🧰 worker · 🛡️ admin

### Auth and users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | 🔓 | Customer: JSON. Worker: multipart with `idProof` (required), `profilePhoto`, `serviceCategory`, `lat`, `lng`, `services` (JSON), `isNegotiable`, `bio`, `experienceYears`. Returns `{ token, user }` |
| POST | `/auth/login` | 🔓 | `{ email, password }` → `{ token, user }` |
| GET | `/users/profile` | 🔐 | Current user |
| PUT | `/users/profile` | 🔐 | Update profile. Email, role, verification and ratings can't be changed here |
| PATCH | `/users/language` | 🔐 | `{ language: 'en'|'ta'|'hi'|'bn' }` |
| POST | `/upload/id-proof` | 🧰 | Field `idProof` (JPG/PNG/WEBP/PDF, ≤ 5 MB). Resets verification |
| POST | `/upload/profile-photo` | 🔐 | Field `profilePhoto` (JPG/PNG/WEBP, ≤ 5 MB) |

### Discovery
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/categories` | 🔓 | The 10 service categories |
| GET | `/workers` | 🔓 | `lat`, `lng` (required), `category`, `radius` (km, ≤ 50), `minPrice`, `maxPrice`, `minRating`, `available=true`. Nearest first, with `distance` (m), `minPrice`, `maxPrice` |
| GET | `/workers/:id` | 🔓 | Public worker profile (no email, phone, ID proof or status log) |
| GET | `/workers/:id/reviews` | 🔓 | Paginated reviews |

### Bookings
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/bookings` | 👤 | `{ workerId, serviceName, scheduledDate: 'YYYY-MM-DD', scheduledTime: 'HH:MM', description?, agreedPrice?, lat?, lng? }` |
| GET | `/bookings/customer` | 👤 | `?status=active|completed|cancelled` |
| GET | `/bookings/worker` | 🧰 | Same filters |
| GET | `/bookings/:id` | 🔐 | The booking's customer, worker or an admin |
| PUT | `/bookings/:id/accept` · `/reject` · `/start` · `/complete` | 🧰 | Lifecycle transitions |
| PUT | `/bookings/:id/cancel` | 👤 | Allowed while requested or accepted. Refunds if paid |

### Payments
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/payments` | 👤 | `{ bookingId, method, methodDetails }` → pending payment |
| PATCH | `/payments/:id/process` | 👤 | Simulated gateway (2 s). `402` with `{ message, payment }` if declined |
| GET | `/payments/booking/:bookingId` | 🔐 | Latest payment for a booking |
| GET | `/payments/my` | 🔐 | Payments made (customer) or received (worker) |

### Earnings (workers)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/earnings/summary` | 🧰 | Today / week / month / lifetime (gross, commission, net, jobs), pending payouts, average rating and job value |
| GET | `/earnings/history?period=daily|weekly|monthly` | 🧰 | 7 days / 4 weeks / 6 months, zero-filled, each with `start`, `earnings`, `net`, `jobs` |
| GET | `/earnings/transactions?page=&limit=` | 🧰 | Completed jobs with amount, commission and net |

### Reviews
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/reviews` | 👤 | `{ bookingId, rating (1–5), comment? }`, completed bookings only, once each |
| GET | `/reviews/worker/:id` | 🔓 | Paginated, with `averageRating` and a 1–5★ `breakdown` |
| GET | `/reviews/booking/:bookingId` | 🔐 | `{ review }` or `{ review: null }` |

### Admin
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | 🛡️ | Platform totals, revenue, today, flags, recent account actions |
| GET | `/admin/stats` | 🛡️ | Users by role, workers by category, bookings by status |
| GET | `/admin/workers` | 🛡️ | `status`, `search`, `page`, `limit`, with jobs and earnings per worker |
| GET | `/admin/workers/:id` | 🛡️ | Full profile, stats, status history, recent bookings and reviews |
| PATCH | `/admin/workers/:id/status` | 🛡️ | `{ status, reason (≥ 10 chars), evidence?: [urls] }`. Suspend/block auto-cancels and refunds |
| GET | `/admin/workers/:id/status-history` | 🛡️ | Audit log, newest first |
| PUT | `/admin/workers/:id/verify` | 🛡️ | `{ isVerified: true|false }` |
| POST | `/admin/evidence` | 🛡️ | Upload an evidence image → `{ url }` |
| GET | `/admin/users` | 🛡️ | `role`, `verified`, `search`, `page` |
| GET | `/admin/customers` | 🛡️ | Customers with booking count and total spent |
| GET | `/admin/bookings` | 🛡️ | `status=all|requested|accepted|in_progress|completed|cancelled` |

---

## 11. Languages (i18n)

- **Supported:** English (`en`), Tamil (`ta`), Hindi (`hi`), Bengali (`bn`). Use the 🌐 selector in the
  navbar.
- **Where the choice is saved:** in the browser (`localStorage`) and, for logged-in users, on their profile.
  The saved language is applied on login. A choice made before logging in is saved to a profile that
  doesn't have one yet.
- **How it's built:** `LanguageContext` loads `client/src/locales/<code>.json`.
  - `t('booking.status.completed')` looks up a key.
  - `t('payment.payAmount', { amount: '₹450' })` fills placeholders.
  - Missing keys fall back to English.
- **Coverage:** every page; dates and times (via `Intl` with `ta-IN`, `hi-IN`, `bn-IN`); earnings chart
  labels; and common server messages, which `api/serverMessages.js` maps to translations.
- **Not translated:** text people type, such as names, service names, bios and review comments.
- **Fonts:** Tamil, Devanagari and Bengali use Noto Sans. Headings switch from the serif font, which has
  no Indic glyphs, to Noto Sans.
- **Adding a language:** copy `en.json` to `xx.json`, translate the values, add it to `DICTIONARIES`,
  `LOCALES` and `languages` in `LanguageContext.jsx`, and to `LANGUAGES` in `server/src/models/User.js`.

---

## 12. Design system

| Token | Colour | Used for |
|---|---|---|
| Navy | `#1B2A4A` | Headings, main text |
| Service Blue | `#3366FF` | Primary buttons, links, logo |
| Amber | `#F5A623` | Booking buttons, stars, *Negotiable* |
| Green | `#2AA876` | Verified, available, success |
| Background | `#FAFBFD` | Page background |
| Muted text | `#5A6A85` | Secondary text |
| Border | `#DFE4ED` | Cards, inputs, dividers |

- **Fonts:** **DM Sans** for body text and **Instrument Serif** for headings.
- **Components:** reusable classes in `index.css`: `.btn-primary/-secondary/-amber/-ghost`,
  `.badge-*`, `.card`, `.input` (with a blue focus glow), `.eyebrow` and `.caption`.
- **Tailwind colours:** the `blue`, `slate`, `emerald` and `amber` scales are remapped to these colours,
  so standard Tailwind classes follow the theme.

---

## 13. Security

- Passwords are hashed with bcrypt and never returned by the API.
- JWT auth: `protect` checks the token, and `authorize(...roles)` checks the role on every protected route.
- Users can't change their own role, verification status or ratings through the profile endpoint.
- **Ownership checks:** workers can only act on their own bookings, and customers only on theirs.
- **Server-side prices:** payment amounts come from the booking on the server.
- **Card data:** card numbers and CVVs are never stored.
- **Privacy:** phone numbers are shared only after a booking is accepted. Public worker profiles never
  include email, phone, ID proof or the status history.
- **Uploads:** type-checked (images / PDF) and limited to 5 MB, with random file names.
- **Admin audit:** status changes require a reason and are recorded in an append-only log.
- **Before going public:** set a strong `JWT_SECRET` and `ADMIN_PASSWORD`, and set `CLIENT_URL` to your
  real frontend URL.

---

## 14. Deployment

| Part | Service | Settings |
|---|---|---|
| Database | **MongoDB Atlas** (free M0) | Create a user, allow `0.0.0.0/0`, copy the `mongodb+srv://` string |
| Files | **Cloudinary** (free) | Copy the cloud name, API key and secret |
| Backend | **Render** web service | Root `server`, build `npm install`, start `npm start`, add every `server/.env` variable |
| Frontend | **Vercel** | Root `client`, framework Vite, env `VITE_API_URL=<Render URL>` |

1. Deploy the backend, then open Render's **Shell** and run `npm run seed && npm run seed:demo && npm run seed:admin`.
2. Deploy the frontend, then set `CLIENT_URL` on Render to the Vercel URL.
3. `client/vercel.json` already rewrites all routes to `index.html`, so refreshing pages like
   `/bookings` works.
4. Live location needs HTTPS, which Vercel provides.
5. Render's free plan sleeps after inactivity, so open the site a minute before a demo.

---

## 15. Demo script

A 5-minute walk-through for judges:

1. **Landing:** switch the language to தமிழ், then हिन्दी, then back to English. Point out the 10 services.
2. **Customer** (`arun.prasad@seed.local`):
   1. Choose **Mechanic** to see nearby mechanics on the map and in the list.
   2. Filter by rating, sort by price, and open a profile with its reviews and rating breakdown.
   3. **Book Now**: pick a service, a date, a time slot and a description.
   4. **Pay**: first try test card `4000 0000 0000 0002` to show a decline, then pay by UPI to show
      success and the transaction ID.
3. **Worker** (log in as the booked worker):
   1. **Requests**: accept the booking. The customer's phone and the job location map appear.
   2. **Jobs**: Start, then Complete.
   3. **Earnings**: today's total updates.
4. **Customer:** **My bookings → Leave a review**, then see the worker's rating update.
5. **Admin** (`admin@seed.local` / `admin123`):
   1. Dashboard stats.
   2. **Workers**: open a worker and **suspend** them with a reason. Their pending bookings are
      cancelled and refunded, and the audit log records it.
   3. Search for them as a customer: they're gone. **Reactivate** them.

---

## 16. Troubleshooting

| Problem | Fix |
|---|---|
| Server exits with *JWT_SECRET is not set* | Create `server/.env` from `.env.example` and set `JWT_SECRET` |
| *Failed to connect to MongoDB* | Start MongoDB (Windows: the *MongoDB* service), or check `MONGO_URI` |
| Map shows 0 workers | The sample workers are in Chennai. Turn live location off, or increase the distance |
| Live location is wrong on a laptop | Laptops estimate location from the network. Use the Chennai default or a phone |
| Teammate sees *localhost refused to connect* | `localhost` only works on your own computer. They must run the app themselves or use a deployed URL |
| Vite error *class does not exist* after changing `tailwind.config.js` | Restart `npm run dev` |
| `node` is not recognised | Install Node.js 18+, then open a new terminal |
| Login works but pages are empty | Run `npm run seed` and `npm run seed:demo` |

---

## 17. Team and modules

The project was split into four modules and then merged into this single app:

| Module | Scope |
|---|---|
| **1. Authentication & users** | Register/login, JWT, profiles, ID proof and photo uploads, route guards |
| **2. Discovery & maps** | Categories, geospatial search, filters, Leaflet map, worker profiles |
| **3. Booking system** | Booking form, date/time slots, status lifecycle, customer and worker booking pages |
| **4. Reviews & admin** | Star ratings, reviews, rating recalculation, admin dashboard and verification |

Added on top: the FixIT theme, simulated payments, the worker earnings dashboard, admin account control
with an audit log, four languages and five more service categories. Original module notes are in
[`docs/`](docs/).

---

## 18. Limitations and future work

- **Payments are simulated.** Production would integrate Razorpay or another real gateway with webhooks.
- **Requests use polling** (every 15 s). WebSockets or push notifications would make updates instant.
- **No chat or calls in the app.** Phone numbers are shared after acceptance instead.
- **Payout settlement is simulated** (7 days). A real payout flow would need bank or UPI details.
- **More features to add:** an installable app (PWA), SMS/OTP login, ID verification via an API,
  worker schedules, and more languages.
