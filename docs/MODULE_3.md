# Module 3 — Booking System

This branch builds on `module_1` (login, `protect`, `authorize`, `AuthContext`).
`server/src/models/Booking.js` and `Review.js` are identical to the copies in `module_4`, so they merge cleanly.

## Status lifecycle

```
requested ──accept──▶ accepted ──start──▶ in_progress ──complete──▶ completed
    │                    │
    ├──reject──▶ rejected│          (worker)
    └──cancel──▶ cancelled ◀──cancel (customer)
```

Rules live in `server/src/utils/bookingStatus.js`. Every change is checked against the booking's current
status and its owner, and applied with a conditional update, so a double click can't apply it twice.

## API

All routes need a logged-in user.

| Method | Route | Role | Notes |
|---|---|---|---|
| POST | `/api/bookings` | customer | `{ workerId, serviceName, scheduledDate: 'YYYY-MM-DD', scheduledTime: 'HH:MM', description?, agreedPrice?, lat?, lng? }`. Worker must be verified and available; `serviceName` must be one of their services. Fixed-price workers always get their listed price; negotiable workers get the customer's `agreedPrice`. Location defaults to the customer's profile location. Same customer + worker + slot while active → 409 |
| GET | `/api/bookings/customer` | customer | `?status=active\|completed\|cancelled` (cancelled includes rejected) or an exact status |
| GET | `/api/bookings/worker` | worker | Same filters |
| GET | `/api/bookings/:id` | customer/worker on it, admin | |
| PUT | `/api/bookings/:id/accept` | worker | requested → accepted |
| PUT | `/api/bookings/:id/reject` | worker | requested → rejected |
| PUT | `/api/bookings/:id/start` | worker | accepted → in_progress |
| PUT | `/api/bookings/:id/complete` | worker | in_progress → completed (sets `completedAt`) |
| PUT | `/api/bookings/:id/cancel` | customer | requested/accepted → cancelled |

Responses include the other party (`workerId` / `customerId` populated with name, photo, rating) and `reviewed`
(true once Module 4 has a review for a completed booking). **Phone numbers are only included once the booking is
accepted.**

## Frontend

| Route | Who | Page |
|---|---|---|
| `/book/:workerId` | customer | Service choice, 14-day date picker with 30-minute slots (8 AM–8 PM), job description, location, price (editable offer if negotiable) |
| `/bookings` | customer | Active / Completed / Cancelled tabs, cancel button, "Leave a review" → `/review/:id` (Module 4) |
| `/worker/dashboard` | worker | Incoming requests with customer location map, Accept / Decline. Polls every 15 s |
| `/worker/jobs` | worker | Start / Complete jobs, earnings total, past jobs |

## Notes for merging

- **Module 2:** "Book Now" on the worker detail page links to `/book/:workerId` with `state={{ worker }}`.
  If the state is missing, the form calls Module 2's `GET /api/workers/:id`, so opening `/book/...` directly
  only works after Module 2 is merged.
- **Module 4:** completed bookings link to `/review/:bookingId` with `state={{ booking }}`. The review page's
  "Back to my bookings" goes to `/bookings`.
- `App.jsx` and `Navbar.jsx` conflict with Module 4's edits to the same lines. Keep both sets of routes and links.
