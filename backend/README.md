# Lead Tracking API (backend)

NestJS + TypeScript REST API for the leads tracking portal. Persists leads and their notes in SQLite via TypeORM, and protects every `/api/leads` route with JWT auth.

## Stack

- NestJS 12, TypeScript
- TypeORM + better-sqlite3 (file database: `database.sqlite`)
- Passport + @nestjs/jwt for auth, bcrypt for passwords
- class-validator / class-transformer for request validation
- Jest (configured; see Tests)

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- A `backend/.env` file with a JWT secret — the app throws on boot without it:

```bash
cp .env.example .env
```

```
JWT_SECRET=<any long random string>
PORT=3000
```

`PORT` is optional and defaults to 3000. `.env` is gitignored; `.env.example` is the committed template.

## Run

```bash
npm install
npm run start:dev
```

The API listens on http://localhost:3000. On boot it:

1. Creates/updates `database.sqlite` (`synchronize: true` syncs the schema)
2. Seeds the admin user if missing: `admin@example.com` / `admin123`

Other scripts:

```bash
npm run build       compile to dist/
npm run start:prod  run the compiled build
npm test            unit tests
npm run lint        oxlint
```

## Docker

The API is containerized via `Dockerfile` (node image, `npm run build` + `start:prod`) and runs as the `backend` service in the root `docker-compose.yml`:

```bash
docker compose up --build   from the repo root
```

In Docker the required `JWT_SECRET` comes from compose (`${JWT_SECRET:-dev-secret-change-me}`), so no `.env` is needed; locally you create it from `.env.example`.

## Endpoints

| Method | Path | Auth | Success | Failing |
| ------ | ---- | ---- | ------- | -------- |
| GET | `/` | – | 200 health text | |
| POST | `/auth/login` | – | 200 `{ access_token }` | 401 invalid credentials |
| GET | `/api/leads?offset=&limit=` | Bearer | 200 `{ data, total }` | 401 |
| GET | `/api/leads?search=&offset=&limit=` | Bearer | 200 array | 401 |
| POST | `/api/leads` | Bearer | 201 lead | 400 validation, 401 |
| GET | `/api/leads/:id` | Bearer | 200 lead | 404 `LEAD_NOT_FOUND`, 401 |
| PATCH | `/api/leads/:id` | Bearer | 200 update result | 401 |
| DELETE | `/api/leads/:id` | Bearer | 204 | 401 |
| GET | `/api/leads/:id/notes?offset=&limit=` | Bearer | 200 `{ data, total }` | 401 |
| POST | `/api/leads/:id/notes` | Bearer | 201 note | 404 missing lead, 400 validation, 401 |

Pagination semantics differ by mode:

- Without `search`: `offset` is a **page number** — the query skips `offset × limit` rows and returns `{ data, total }`
- With `search`: rows are filtered by name/email (`like`, ordered by name) and returned as a plain array; here `offset` is a **row offset**
- Notes: like the plain list — `offset` is a page number, oldest first

## Validation

`main.ts` registers a global `ValidationPipe({ whitelist: true, transform: true })`. DTOs validate and trim input:

- `CreateLeadDto`: `name`, `email` (IsEmail), `phone` required; `status` must be one of `new | contacted | qualified | lost`
- `UpdateLeadDto`: same fields, all optional
- `CreateNoteDto`: `content` required
- `LoginDto`: `email` (IsEmail) + `password` required

Bad input returns 400 with the failed constraints:

```json
{ "message": ["email must be an email"], "error": "Bad Request", "statusCode": 400 }
```

Custom `AppException`s (see `src/common/exceptions/`) flow through `HttpExceptionFilter`:

```json
{ "statusCode": 404, "message": "lead not found for given id : 99999", "error": "LEAD_NOT_FOUND" }
```

## curl examples

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

curl -s -X PATCH $BASE/api/leads/1 \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"qualified"}'

curl -s -X POST $BASE/api/leads/1/notes \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"content":"Called, asked for a demo"}'

curl -s -X DELETE $BASE/api/leads/1 -H "Authorization: Bearer $TOKEN" -i
```

## Data model

- `lead`: id, name, email, phone, status (`new|contacted|qualified|lost`, default `new`), createdAt, updatedAt; one-to-many notes
- `note`: id, leadId (FK with `onDelete: 'CASCADE'`), content, createdAt, updatedAt
- `user`: id, email (unique), password (bcrypt hash), role (default `ADMIN`)

Deleting a lead removes its notes. If you ever see a foreign-key 500 on delete, the sqlite file predates the cascade — delete `database.sqlite` and let the app re-create the schema (leads will be lost).

## Project structure

```
src/
├── main.ts                        bootstrap, ValidationPipe, exception filter
├── app.module.ts                  ConfigModule, TypeORM (sqlite), feature modules
├── auth/
│   ├── auth.controller.ts         POST /auth/login
│   ├── auth.service.ts            credentials check, JWT sign, admin seeding
│   ├── auth.module.ts             JWT config (secret from .env, 1h expiry)
│   ├── dto/login.dto.ts
│   ├── entities/user.entity.ts
│   ├── guards/jwt-auth/           JwtAuthGuard (protects the leads controller)
│   └── strategies/jwt/            JwtStrategy (validates Bearer tokens)
├── leads/
│   ├── leads.controller.ts        /api/leads + /api/leads/:id/notes
│   ├── leads.service.ts           CRUD, search (raw SQL like), notes
│   ├── dto/                       create/update lead, create note
│   ├── entities/                  lead.entity.ts, note.entity.ts
│   ├── enums/lead-status-enum.ts
│   ├── utils/lead-mapping.ts      DTO -> entity mappers
│   └── health/health.controller.ts
└── common/exceptions/             AppException, HttpExceptionFilter
```

## Tests

`npm test` runs the Jest unit tests — 31 tests across six suites: the leads controller routes (create, list vs search, 404 on a missing lead, notes), the leads service (pagination, note linking, the search query), auth (login success and both 401 cases, admin seeding) and the JWT strategy. All pass.

## Known notes

- `synchronize: true` — schema is auto-synced on boot; fine for the practical, not for production
- Lead emails are not unique at the DB/service level; the frontend guards duplicates via the search endpoint
- `PATCH` returns TypeORM's raw update result; clients should re-fetch the entity
- `DELETE` answers 204 even when the id does not exist
- A handful of `console.log` debug statements remain from development
- Both `sqlite3` and `better-sqlite3` are installed; only `better-sqlite3` is used
