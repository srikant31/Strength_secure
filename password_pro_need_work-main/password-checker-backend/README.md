# SecureVault — Backend (Express + MongoDB)

## Quick start

```bash
cd password-checker-backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev            # nodemon — hot-reload
```

## API endpoints

| Method | Path                        | Auth? | Description                  |
|--------|-----------------------------|-------|------------------------------|
| GET    | /api/health                 | —     | Health check                 |
| POST   | /api/auth/register          | —     | Register new user            |
| POST   | /api/auth/login             | —     | Login, receive JWT           |
| GET    | /api/auth/me                | ✅    | Get current user             |
| POST   | /api/auth/change-password   | ✅    | Change password (w/ history) |
| GET    | /api/users/profile          | ✅    | User profile                 |
| GET    | /api/users/history          | ✅    | Password history (hashes)    |

## Security features

- **bcrypt** (cost=12) — passwords never stored in plaintext
- **Password history** — last 5 hashes stored, reuse blocked
- **Server-side strength gate** — score < 40 rejected at API level
- **JWT RS256** — stateless auth, 7-day expiry
- **Rate limiting** — 20 auth requests per 15 min per IP
- **Helmet** — sets secure HTTP headers
- **Generic error messages** — login never reveals whether email exists

## Directory structure

```
password-checker-backend/
├── config/
│   └── db.js                   ← Mongoose connection
├── src/
│   ├── server.js               ← Express app entrypoint
│   ├── models/
│   │   └── User.model.js       ← Mongoose schema + bcrypt methods
│   ├── routes/
│   │   ├── auth.routes.js      ← /api/auth/*
│   │   └── user.routes.js      ← /api/users/*
│   ├── middleware/
│   │   ├── auth.middleware.js  ← JWT guard
│   │   └── error.middleware.js ← Central error handler
│   └── utils/
│       ├── jwt.js              ← sign / verify helpers
│       └── passwordStrength.js ← Server-side strength mirror
├── .env.example
└── package.json
```
