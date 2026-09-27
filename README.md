# Lead Tracking App

A small web portal to manage sales leads, backed by an API. Built as two apps in one repo:

- `backend/` — NestJS REST API with JWT auth, SQLite (TypeORM), leads + notes CRUD
- `frontend/` — React SPA (Vite + TypeScript + Redux Toolkit) that consumes the API

Implements the practical brief "Leads Tracking App (API + Web)": leads CRUD, notes per lead, a web portal (list / search / detail with notes / create form), validation with proper HTTP codes, plus the bonus items pagination and basic auth.

## Repository layout

```
lead-tracking-app/
├── docker-compose.yml   backend + frontend, one command to run both
├── backend/          NestJS API (port 3000)
│   ├── src/
│   │   ├── auth/     login, JWT strategy + guard, user entity, admin seeding
│   │   ├── leads/    leads + notes controller, service, DTOs, entities
│   │   └── common/   app exception + http exception filter
│   ├── Dockerfile    node image, build + start:prod
│   ├── database.sqlite   created automatically on first boot
│   ├── .env.example  template for the required .env (JWT_SECRET)
│   └── .env          JWT_SECRET (required, gitignored)
├── frontend/         React app (port 5173, proxies /api and /auth to 3000)
│   ├── Dockerfile    node image, runs the Vite dev server
│   └── src/
│       ├── api/      axios client with interceptors, typed API functions
│       ├── components/  Navbar, Pagination, StatusBadge, ConfirmDialog
│       ├── features/    Redux Toolkit slices (auth, leads, notes)
│       ├── pages/       Login, Leads list, Lead detail, Lead form, NotFound
│       ├── store/       redux store + typed hooks
│       ├── styles/      plain CSS (single stylesheet)
│       └── types/       shared TS types
└── README.md         this file
```

## Stack

| Layer    | Technology |
| -------- | ---------- |
| Backend  | NestJS 12, TypeScript, TypeORM, better-sqlite3, Passport + JWT, bcrypt, class-validator |
| Database | SQLite file (`backend/database.sqlite`), schema auto-synced on boot |
| Frontend | React 19, Vite 8, TypeScript, Redux Toolkit, Axios, React Router 7, plain CSS |

## Prerequisites

- Node.js 20.19+ or 22.12+ (LTS recommended)
- npm (bundled with Node)
- Docker + Docker Compose (only for the containerized setup — see Docker)
- No external database — SQLite is a file created on first boot

## Run the app

Two terminals, backend first:

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

The API boots on http://localhost:3000. On first start it creates `database.sqlite` and seeds an admin user.

```bash
cd frontend
npm install
npm run dev
```

The portal boots on http://localhost:5173. The Vite dev server proxies `/api` and `/auth` to the backend, so no CORS configuration is needed.

Login with the seeded user:

- Email: `admin@example.com`
- Password: `admin123`

Production builds:

```bash
cd backend  && npm run build && npm run start:prod
cd frontend && npm run build
```

## Configuration

`backend/.env` is required for local dev — the JWT strategy throws at boot without it. Copy the committed template and put a long random string in it:

```bash
cd backend
cp .env.example .env
```

```
JWT_SECRET=<any long random string>
PORT=3000
```

`PORT` is optional and defaults to 3000. In Docker, `JWT_SECRET` comes from `docker-compose.yml` (which falls back to a dev placeholder when you don't provide one).

## The web portal

- **Login** — JWT login, expired/invalid sessions redirect back to login
- **Leads list** — table with search by name/email, pagination, page size, status badges, row click to open detail
- **Lead detail** — contact panel, notes timeline, add-note form, paginated notes, edit + delete actions
- **Lead form** — create and edit with inline validation (required fields, email/phone format, duplicate email check)
- Edge cases handled: 404 lead page, empty states, loading skeletons, error banners with retry, backend errors surfaced in context (delete errors inside the confirm dialog, note errors in the notes panel)

## Data model

```
lead                      note                       user
----                      ----                       ----
id (PK)                   id (PK)                    id (PK)
name                      leadId (FK -> lead.id,     email (unique)
email                       onDelete: CASCADE)      password (bcrypt)
phone                     content                    role (default ADMIN)
status (new | contacted   createdAt                  createdAt
       | qualified | lost) updatedAt
createdAt
updatedAt                 One lead has many notes; deleting a lead removes its notes.
```

## API reference

All `/api/leads` routes require `Authorization: Bearer <token>`. Get the token from `POST /auth/login`.

| Method | Path | Auth | Success | Notes |
| ------ | ---- | ---- | ------- | ----- |
| POST | `/auth/login` | – | 200 `{ access_token }` | 401 on wrong credentials |
| GET | `/` | – | 200 `"app is running"` | health check |
| GET | `/api/leads?offset=&limit=` | Bearer | 200 `{ data, total }` | `offset` is a **page number** (server skips `offset × limit`); default 0/10 |
| GET | `/api/leads?search=&offset=&limit=` | Bearer | 200 array | plain array (no total), ordered by name; here `offset` is a **row offset** |
| POST | `/api/leads` | Bearer | 201 lead | validates name/email/phone/status |
| GET | `/api/leads/:id` | Bearer | 200 lead | 404 `LEAD_NOT_FOUND` if missing |
| PATCH | `/api/leads/:id` | Bearer | 200 update result | all fields optional |
| DELETE | `/api/leads/:id` | Bearer | 204 | notes cascade-deleted |
| GET | `/api/leads/:id/notes?offset=&limit=` | Bearer | 200 `{ data, total }` | oldest first, `offset` is a page number |
| POST | `/api/leads/:id/notes` | Bearer | 201 note | 404 if the lead does not exist |

### Validation and errors

DTOs use class-validator (`IsEmail`, `IsNotEmpty`, `IsEnum`, plus trim transforms) behind a global `ValidationPipe` with `whitelist` + `transform`, so unknown fields are stripped and bad input is rejected before the service:

```json
{ "message": ["email must be an email"], "error": "Bad Request", "statusCode": 400 }
```

Not-found uses a custom `AppException`:

```json
{ "statusCode": 404, "message": "lead not found for given id : 99999", "error": "LEAD_NOT_FOUND" }
```

Status codes in use: 200, 201, 204, 400 (validation), 401 (missing/invalid token or bad credentials), 404 (missing lead).

## API examples (curl)

`curl` is a command-line tool for making HTTP requests from a terminal. The brief asks for README steps plus API examples using curl — these let an evaluator exercise the whole API without the UI or Postman: log in, save the token, then call each endpoint with `-X GET/POST/PATCH/DELETE`, `-H` for headers and `-d` for the JSON body.

```bash
BASE=http://localhost:3000

TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | sed 's/.*"access_token":"\([^"]*\)".*/\1/')

curl -s "$BASE/api/leads?offset=0&limit=10" -H "Authorization: Bearer $TOKEN"

curl -s -X POST $BASE/api/leads \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","phone":"9999999999","status":"new"}'

curl -s $BASE/api/leads/1 -H "Authorization: Bearer $TOKEN"

curl -s "$BASE/api/leads?search=test@example.com" -H "Authorization: Bearer $TOKEN"

curl -s -X PATCH $BASE/api/leads/1 \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"contacted"}'

curl -s -X POST $BASE/api/leads/1/notes \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"content":"First follow-up call done"}'

curl -s $BASE/api/leads/1/notes -H "Authorization: Bearer $TOKEN"

curl -s -X DELETE $BASE/api/leads/1 -H "Authorization: Bearer $TOKEN" -i
```

Add `-i` to any call to see the status code, or `-o /dev/null -w '%{http_code}'` to print only the code.

## Requirements coverage

Brief item | Status
---------- | ------
Backend: Node + Express **or NestJS** | NestJS + TypeScript
DB: SQLite (recommended) | SQLite via TypeORM + better-sqlite3
Frontend: React | React 19 SPA (TypeScript)
Leads CRUD (id, name, email, phone, status, createdAt) | Done, plus updatedAt
Notes per lead (id, leadId, content, createdAt) | Done, cascade delete verified
Leads list page (search by name/email) | Done
Lead detail page (notes + add note form) | Done, paginated notes
Create lead page/form | Done, plus edit and delete
All 7 API endpoints | Done (`GET /api/leads?search=&status=`: the `status` filter param is not implemented — the brief's feature list only asks for search by name/email, so filtering by status was intentionally left out)
Validation + errors (400/404/201, email format, required fields) | Done via class-validator + global ValidationPipe + exception filter
Bonus: pagination | Done (leads list and notes, configurable page size)
Bonus: basic auth | Done (JWT login, bcrypt, guarded routes, seeded admin)
Bonus: unit test (Jest) | Done — 31 unit tests (`cd backend && npm test`) covering the leads routes, service, auth and JWT strategy
Bonus: Dockerfile | Done — Dockerfile per app + `docker-compose.yml` at the root (`docker compose up --build`)
`npm install` + dev run works | Done (one install/run per app; see Run the app)
Seed script or UI to add first lead | Both: admin auto-seeds on boot, leads are created from the UI
README with steps + curl examples | This file, plus `backend/README.md` and `frontend/README.md`

## Testing

```bash
cd backend && npm test
cd frontend && npm run build
```

The backend suite covers the leads routes (create, list vs search, 404 on a missing lead, notes), the leads service (pagination, note linking, the search query), auth (login success and both 401 cases, admin seeding) and the JWT strategy — 31 Jest unit tests, all passing. The frontend has no test suite; `npm run build` is the verification step.

## Docker

The whole stack runs with one command — no `.env` setup needed:

```bash
docker compose up --build
```

- Portal: http://localhost:5173
- API: http://localhost:3000 (health check at `GET /`)
- Login with `admin@example.com` / `admin123` (seeded on first boot)

What the setup does:

- `backend` — builds the NestJS app and runs `npm run start:prod` on port 3000; `JWT_SECRET` is taken from your environment and falls back to `dev-secret-change-me` if unset (`JWT_SECRET=my-secret docker compose up` to override)
- `frontend` — runs the Vite dev server on port 5173 with `API_PROXY_TARGET=http://backend:3000`, so the proxy targets the backend container by name
- The SQLite file lives inside the backend container — data survives a restart (`docker compose stop`) but is reset when the container is removed (`docker compose down`); to keep it on your machine, add a volume to the backend service:

  ```yaml
  volumes:
    - ./backend/database.sqlite:/app/database.sqlite
  ```

Stop the stack with `Ctrl+C` or `docker compose down`. To run without Docker, see Run the app — `API_PROXY_TARGET` defaults to `http://localhost:3000`, so local dev works with no configuration.

## Notes and known quirks

- `synchronize: true` recreates/mutates the SQLite schema on boot — convenient for the practical, not for production
- The API does not enforce unique lead emails; the frontend checks for duplicates through the search endpoint before saving
- `PATCH` returns TypeORM's raw update result rather than the updated entity, so the frontend re-fetches the lead after saving
- `DELETE` returns 204 even when the id does not exist
- JWTs expire after 1 hour (`expiresIn: '1h'` in `backend/src/auth/auth.module.ts`)
- `backend/package.json` lists both `sqlite3` and `better-sqlite3`; only `better-sqlite3` is used
- The backend keeps a few `console.log` debug statements from development

## Submitting to GitHub

Keep `database.sqlite`, `node_modules/`, `dist/`, and `backend/.env` out of the repo — the `.gitignore` files in `backend/` and `frontend/` already handle this.
