# Module 2 — Service Discovery and Maps

## Run locally

Requires Node.js 18+ and MongoDB (local or Atlas).

```bash
# Backend
cd server
cp .env.example .env        # set MONGO_URI
npm install
npm run seed                # 15 workers, 3 customers, reviews around Chennai
npm run dev                 # http://localhost:5000

# Frontend (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api to :5000)
```

Seeded accounts use `@seed.local` emails and the password `password123`.
Re-running the seed only replaces `@seed.local` accounts.

## API

| Method | Route | Query / notes |
|---|---|---|
| GET | `/api/categories` | Static list: plumbing, electrical, carpentry, painting, cleaning |
| GET | `/api/workers` | `lat`, `lng` (required), `category`, `radius` (km, default 10, max 50), `minPrice`, `maxPrice`, `minRating`, `available=true`. Verified workers only, nearest first, `distance` in metres, plus `minPrice`/`maxPrice` |
| GET | `/api/workers/:id` | Public worker profile (no email, phone or ID proof) |
| GET | `/api/workers/:id/reviews` | `page`, `limit` (max 50). Reviews with customer name populated |

## Frontend routes

| Route | Page |
|---|---|
| `/dashboard` | Category cards + location capture |
| `/workers?category=<id>` | Filters sidebar, Leaflet map, worker cards |
| `/workers/:id` | Profile, services and prices, reviews, map, **Book Now** → `/book/:id` |

## Notes for merging with other modules

- **Module 1:** `server/src/models/User.js` holds every field from the plan. Keep the `location` field
  without defaults (no default `type: 'Point'`), or customers without coordinates will fail the
  2dsphere index. Workers must have `location` set at registration to appear in search.
  The API client sends `localStorage.token` as a Bearer token.
- **Module 3:** "Book Now" links to `/book/:workerId` and passes the worker in router `state`.
- **Module 4:** `server/src/models/Review.js` is a minimal copy of the planned Review model, used only
  for reading. Replace it with yours. Search only returns `isVerified: true` workers, so newly
  registered workers appear after an admin verifies them.
