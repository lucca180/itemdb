# Authentication

itemdb uses a **email magic link** flow. There are no passwords. Users receive a one-time link via email, click it, and receive a signed JWT session cookie that authenticates all subsequent requests.

---

## Flow overview

```
1. POST /api/auth/sendLink  { cred: email | username }
        │
        ▼
   createMagicToken(email, origin)
   ├─ dev:  token stored in memory, full link printed to terminal
   └─ prod: sha256(token) stored in Redis with 15-min TTL
        │
        ▼  (link sent via Resend in production)
   /login?token=<raw token>&email=<email>

2. Browser lands on /login
        │
        ▼
   POST /api/auth/login  { token, email }
        │
        ▼
   consumeMagicToken(token, email)   ← one-time, deletes after use
        │
        ▼
   prisma.user.upsert(email)         ← creates account on first login
        │
        ▼
   signSession({ uid, email, role }) ← HS256 JWT, 13-day expiry
        │
        ▼
   Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Strict
        │
        ▼
   returns User object to client
```

---

## Session cookie

| Property  | Value |
|-----------|-------|
| Name      | `session` |
| Algorithm | HS256 (via [jose](https://github.com/panva/jose)) |
| Expiry    | 13 days |
| Refresh   | Transparently reissued by `GET /api/auth/me` when < 7 days remain |
| Flags     | `HttpOnly`, `Secure`, `SameSite=Strict` |
| Payload   | `{ uid, email, role, iat, exp }` |

The secret is read from the `JWT_SECRET` environment variable. See `.env.default` for the required format.

---

## Server-side auth (`CheckAuth`)

All API routes authenticate by calling `CheckAuth(req)` from `utils/googleCloud.ts`:

```ts
const { user, decodedToken } = await CheckAuth(req);
if (!user) return res.status(401).json({ error: 'Unauthorized' });
```

`CheckAuth` reads `req.cookies.session`, verifies the JWT against `JWT_SECRET`, and returns the `User` from the database. It throws if the cookie is absent or invalid.

---

## Client-side auth (`AuthProvider`)

`utils/auth.tsx` wraps the app in an `AuthProvider`. On mount it calls `GET /api/auth/me` to bootstrap the user state. The result is stored in `sessionStorage` via Jotai (`UserState` atom) so it persists across client-side navigations but is cleared on tab close.

```
page load
    │
    ▼
GET /api/auth/me
    ├─ 200 → setUser(data), setAuthLoading(false)
    │         (cookie silently refreshed if < 7 days remain)
    └─ 401 → setUser(null), setAuthLoading(false)
```

`signout()` posts to `POST /api/auth/logout`, which clears the `session` cookie server-side, then calls `resetUser()` to clear client state.

---

## Relevant files

| File | Purpose |
|------|----------|
| `utils/auth/jwt.ts` | `signSession` / `verifySession` / `needsRefresh` using `jose` |
| `utils/auth/magicLink.ts` | Create and consume one-time magic tokens |
| `utils/auth/firebaseAdmin.ts` | Legacy Firebase session cookie verification (migration only) |
| `utils/googleCloud.ts` | `CheckAuth` — used by every protected API route |
| `pages/api/auth/sendLink.ts` | Issue a magic link for a given email or username |
| `pages/api/auth/login.ts` | Consume magic token, upsert user, set JWT cookie |
| `pages/api/auth/me.ts` | Return current user; refresh cookie if nearing expiry |
| `pages/api/auth/logout.ts` | Clear the `session` cookie |
| `pages/api/auth/delete.ts` | Delete user account and clear cookie |
| `pages/login.tsx` | Login page — reads `?token=&email=` from URL |
| `utils/auth.tsx` | `AuthProvider` React context |

---

## Local development

No email service or Redis is required. When `NODE_ENV=development`:

- `createMagicToken` stores the token in an **in-memory Map** (reset on server restart).
- The full magic link is **printed to the terminal** (`console.warn`).
- The only required env var is `JWT_SECRET` — any string works in dev.

Minimum `.env` for local dev:

```env
DATABASE_URL=mysql://...
JWT_SECRET=dev-secret-do-not-use-in-production
```

---

## Migration from Firebase (transitional period)

During the migration window, `GET /api/auth/me` accepts both old Firebase session cookies and new JWT cookies:

```
GET /api/auth/me
    │
    ├─ try verifySession(cookie)  ← new JWT
    │       └─ OK → return user
    │
    └─ try verifyLegacyFirebaseSession(cookie)  ← old Firebase cookie
            ├─ OK → issue new JWT cookie, return user  (transparent upgrade)
            └─ fail → 401
```

This is handled in `pages/api/auth/me.ts` using `utils/auth/firebaseAdmin.ts`. It requires `firebase-key.json` to be present on the server. If the file is absent (e.g. dev contributors), the Firebase fallback is simply skipped.

**Once the 13-day session window has passed after the migration deploy**, the following can be removed:

- `utils/auth/firebaseAdmin.ts`
- the Firebase fallback block in `pages/api/auth/me.ts`
- `firebase-admin` from `package.json`
- `firebase-key.json` from the server (already excluded from the repo)
