# Blue-Collar Service Platform

A hyperlocal, on-demand platform connecting customers with nearby verified blue-collar workers
(plumbers, electricians, carpenters, painters, cleaners). It has transparent pricing, GPS-based
discovery on a map, negotiable prices, a full booking lifecycle, and ratings and reviews.

Built for the Vecnaverse Hackathon (Problem Statement 3, Social Impact).

**Stack:** React 18, Vite, Tailwind CSS, React Router, Leaflet + OpenStreetMap · Node.js, Express,
MongoDB, Mongoose (geospatial queries) · JWT auth · Cloudinary uploads (optional).

## Run locally

Requires **Node.js 18+** and **MongoDB** (local, or a MongoDB Atlas connection string).

```bash
# 1. Backend
cd server
cp .env.example .env        # set MONGO_URI and JWT_SECRET
npm install
npm run seed                # 15 sample workers around Chennai, 3 customers, reviews
npm run seed:admin          # admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                 # http://localhost:5000

# 2. Frontend (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

### Sample accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@seed.local` | `admin123` |
| Customer | `arun.prasad@seed.local` | `password123` |
| Worker (plumber, negotiable) | `ravi.kumar@seed.local` | `password123` |

All seeded workers use `<first>.<last>@seed.local` with `password123`.

## How it works

1. **Customer** signs up, shares their location, and picks a category. Nearby verified workers appear
   on a map and in a list, nearest first, with filters for distance, price, rating and availability.
2. They open a worker's profile (services, prices, reviews) and **book** a service, date and time slot,
   offering their own price if the worker is negotiable.
3. **Worker** sees the request with the job location on a map, then accepts it, starts the job and
   marks it complete.
4. **Customer** leaves a star rating and review, and the worker's average rating updates.
5. **Admin** sees platform stats and verifies workers' ID proofs. Only verified workers appear in search.

Booking lifecycle: `requested → accepted → in_progress → completed`, with `rejected` (worker) and
`cancelled` (customer, before work starts).

## Project structure

```
server/src/
  models/       User (2dsphere location), Booking, Review
  routes/       auth, users, upload · categories, workers · bookings · reviews, admin
  controllers/  one per area
  middleware/   auth (protect / authorize), upload (multer), error handler
  seed/         seedWorkers.js, seedAdmin.js
client/src/
  pages/        Landing, Login, Register, Profile · CustomerDashboard, WorkerListing, WorkerDetail ·
                BookingForm, MyBookings, WorkerRequests, WorkerJobs · ReviewPage, WorkerReviews,
                AdminDashboard, AdminUsers
  components/   Navbar, ProtectedRoute, WorkerMap, FilterSidebar, DateTimePicker, StarRating, ...
  api/          one file per module on top of a shared axios client
```

API reference and per-module details: [docs/MODULE_1.md](docs/MODULE_1.md) (auth and users),
[docs/MODULE_2.md](docs/MODULE_2.md) (discovery and maps), [docs/MODULE_3.md](docs/MODULE_3.md) (bookings),
[docs/MODULE_4.md](docs/MODULE_4.md) (reviews and admin).

## Deployment

- **Database:** MongoDB Atlas. Put the connection string in `MONGO_URI`.
- **Backend:** Render. Set every variable from `server/.env.example`, with `CLIENT_URL` = your Vercel URL.
  Set the Cloudinary keys, since Render's disk is wiped on each deploy.
- **Frontend:** Vercel, with root `client/` and `VITE_API_URL` = your Render URL.
