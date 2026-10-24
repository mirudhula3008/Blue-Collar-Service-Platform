# Module 1 — Authentication and User Management

## Run locally

Requires Node.js 18+ and MongoDB.

```bash
cd server
cp .env.example .env     # set MONGO_URI and JWT_SECRET (Cloudinary keys optional)
npm install
npm run dev              # http://localhost:5000

cd client
npm install
npm run dev              # http://localhost:5173
```

Without Cloudinary keys, uploads are saved to `server/uploads/` and served at `/uploads/...`.
Render wipes its disk on every deploy, so set the Cloudinary keys in production.

## API

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | Customer: JSON. Worker: `multipart/form-data` with `idProof` (required) and `profilePhoto` files, `serviceCategory`, `lat`, `lng` (required), optional `services` (JSON string), `isNegotiable`, `bio`, `experienceYears`. Returns `{ token, user }` |
| POST | `/api/auth/login` | — | `{ email, password }` → `{ token, user }` |
| GET | `/api/users/profile` | any | Current user |
| PUT | `/api/users/profile` | any | `name`, `phone`, `address`, `lat`, `lng`; workers also `serviceCategory`, `services`, `bio`, `experienceYears`, `isNegotiable`, `availability`. Email, role, verification and ratings are ignored |
| POST | `/api/upload/id-proof` | worker | Field `idProof` (JPG/PNG/WEBP/PDF, max 5 MB). Resets `isVerified` to false |
| POST | `/api/upload/profile-photo` | any | Field `profilePhoto` (JPG/PNG/WEBP, max 5 MB) |

Send the token as `Authorization: Bearer <token>`. Tokens expire after `JWT_EXPIRES_IN` (default 7 days).

## For other modules

**Backend**

```js
const { protect, authorize } = require('../middleware/auth');
router.get('/mine', protect, handler);                       // any logged-in user, req.user is set
router.put('/:id/accept', protect, authorize('worker'), h);   // workers only
router.get('/stats', protect, authorize('admin'), h);         // admins only
```

`utils/http.js` has `asyncHandler` (wraps async handlers) and `httpError(status, message)`.
Throwing an `httpError` returns `{ message }` with that status.

**Frontend**

```jsx
import { useAuth } from '../context/AuthContext';
const { user, logout } = useAuth();              // user.role is 'customer' | 'worker' | 'admin'

<ProtectedRoute roles={['worker']}><MyPage /></ProtectedRoute>
```

`api/client.js` attaches the token automatically. After login, users land on `homePathFor(role)`:
customer `/dashboard` (Module 2), worker `/worker/dashboard` (Module 3), admin `/admin` (Module 4).
These are placeholders in this branch. Replace them in `App.jsx` when merging.

Admins can't sign up through the form. Module 4's `npm run seed:admin` creates the first admin.
