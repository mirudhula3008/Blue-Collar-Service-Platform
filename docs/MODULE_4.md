# Module 4 — Reviews, Ratings and Admin

This branch builds on `module_1` (it needs login, `protect` and `authorize`).
Merge `module_1` into `main` first; then `module_4` merges on top without conflicts.

## Run locally

```bash
cd server
cp .env.example .env     # MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run seed:admin       # creates admin@seed.local / admin123 (or your .env values)
npm run dev

cd client
npm install
npm run dev              # log in as the admin → /admin
```

## API

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/reviews` | customer | `{ bookingId, rating (1–5 whole number), comment? }`. Booking must belong to the customer and be `completed`. One review per booking (409 on repeat). Recalculates the worker's `averageRating` and `totalReviews`, and returns them as `workerRating` |
| GET | `/api/reviews/worker/:id` | public | `page`, `limit` (max 50). Returns `reviews`, `total`, `pages`, `averageRating`, `breakdown` `{1..5: count}` |
| GET | `/api/reviews/booking/:bookingId` | booking's customer/worker, admin | `{ review }` or `{ review: null }`, for showing "Leave a review" vs. the submitted review |
| GET | `/api/admin/stats` | admin | User counts by role, verified/pending workers, workers per category, bookings per status, review count and average, 5 newest users |
| GET | `/api/admin/users` | admin | `role`, `verified=true/false` (workers only), `search` (name/email/phone), `page`, `limit` |
| PUT | `/api/admin/workers/:id/verify` | admin | `{ isVerified: true/false }` (default true). Unverified workers are hidden from Module 2's search |

## Frontend

| Route | Who | Page |
|---|---|---|
| `/review/:bookingId` | customer | Star rating + comment form; shows the existing review if one was already submitted |
| `/worker/reviews` | worker | Read-only reviews with rating summary |
| `/admin` | admin | Stat tiles, bookings by status, workers by category, newest accounts |
| `/admin/users` | admin | Search/filter users, view ID proofs, verify/unverify workers |

Reusable components:

- `StarRating`: `<StarRating value={4} />` (display) or `<StarRating value={v} onChange={setV} />` (input, keyboard accessible)
- `ReviewForm`: `<ReviewForm bookingId={id} workerName="Ravi" onSubmitted={fn} />`
- `ReviewList`: `<ReviewList workerId={id} />`, a rating summary with paginated reviews. Module 2's worker detail page can use this in place of its own list.

## Notes for merging

- **Module 3:** `server/src/models/Booking.js` here is a read-only copy of the planned Booking model,
  used for review checks and stats. Replace it with yours and keep `customerId`, `workerId` and `status`
  (with the value `completed`), plus the `BOOKING_STATUSES` export. On the My Bookings page, link completed
  bookings to `/review/:bookingId` (pass `state={{ booking }}` to show the worker's name). The review page's
  back link goes to `/bookings`.
- **Module 2:** the seed script there writes reviews directly. That's fine, because ratings are recalculated from the
  Review collection on the next review.
