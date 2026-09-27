# LeadFlow — Frontend

React + TypeScript SPA for the leads tracking API.

## Stack

- Vite 8, React 19, TypeScript
- Redux Toolkit (thunks) for state
- Axios with request/response interceptors (JWT attach + 401 session handling)
- React Router 7
- Plain CSS (single stylesheet)

## Prerequisites

- Node.js 20.19+ or 22.12+ and npm
- The backend running on http://localhost:3000 (see `../backend/README.md`)

## Run

1. Start the backend first (port 3000):

   ```bash
   cd ../backend
   npm install
   npm run start:dev
   ```

2. Start the frontend:

   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:5173

The Vite dev server proxies `/api` and `/auth` to the backend, so no CORS setup is needed. The target defaults to `http://localhost:3000` and can be overridden with the `API_PROXY_TARGET` environment variable — `docker-compose.yml` sets `API_PROXY_TARGET=http://backend:3000` so the same code works in both modes with no edits.

Other scripts:

```bash
npm run build   type-check + production build to dist/
npm run lint    oxlint
```

Docker: the frontend runs as the `frontend` service in the root `docker-compose.yml` (Vite dev server on `0.0.0.0:5173`, proxy pointed at the backend container) — `docker compose up --build` from the repo root starts both apps.

## Login

A demo user is seeded automatically by the backend:

- Email: `admin@example.com`
- Password: `admin123`

## Features

- Login with JWT, auto-redirect on expired sessions
- Leads list with search (name/email), pagination and page size
- Create and edit leads with inline validation (required fields, email/phone format, duplicate email)
- Delete leads with confirmation; failures show the backend error inside the dialog
- Lead detail with contact panel, notes timeline, add-note form and paginated notes
- Empty states, loading skeletons, error banners with retry, 404 handling

## Project structure

```
src/
├── api/
│   ├── axios.ts        instance + interceptors + getErrorMessage
│   ├── auth.ts         login
│   └── leads.ts        leads + notes calls
├── components/         Navbar, Pagination, StatusBadge, ConfirmDialog
├── features/
│   ├── authSlice.ts    token + user session
│   ├── leadsSlice.ts   list/search/pagination, current lead, save/delete
│   └── notesSlice.ts   paginated notes per lead
├── pages/              LoginPage, LeadsPage, LeadDetailPage, LeadFormPage, NotFoundPage
├── store/              store config + typed hooks
├── styles/index.css    all styling
├── types/              shared types (Lead, Note, API responses)
└── utils/format.ts     date + initials helpers
```

## API examples (against the backend)

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}' | sed 's/.*"access_token":"\([^"]*\)".*/\1/')

curl -s "http://localhost:3000/api/leads?offset=0&limit=10" -H "Authorization: Bearer $TOKEN"

curl -s -X POST http://localhost:3000/api/leads \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","phone":"9999999999","status":"new"}'

curl -s -X POST http://localhost:3000/api/leads/1/notes \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"content":"First follow-up call done"}'
```

## Notes on the backend (not modified by this frontend)

- The JWT expires after 1 hour (`expiresIn: '1h'` in `backend/src/auth/auth.module.ts`); expired sessions are signed out automatically
- `POST /api/leads` does not check for duplicate emails, so the form checks existing emails through the search endpoint before saving
- Search responses return a plain array while the normal list returns `{ data, total }`; both are handled
- `PATCH /api/leads/:id` returns the raw update result, so the lead is re-fetched after saving
