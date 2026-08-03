# EduManager — Assignment & Submission Management System

A refined, role-based platform for schools and colleges. Teachers create and
grade assignments, students view and submit them, and admins manage users,
classes, subjects and system settings — all behind JWT-based authentication.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**,
**Tailwind v4**, **shadcn/ui (Base UI)**, **Prisma 7** on **PostgreSQL**, with
**Zod** validation and **Vitest + Playwright** tests.

---

## Main features

**Admin**
- Manage users (create / edit / delete / activate-deactivate)
- Manage classes and subjects (CRUD)
- Map subjects to classes
- Assign teachers to class + subject combinations
- View all assignments and submissions (system-wide)
- Application-level settings
- Dashboard with system-wide stats

**Teacher**
- Create, update, delete and publish/unpublish assignments
- Assign to a class + subject, set title, description, deadline, max marks
- Save as draft or publish
- Filter assignments (All / Published / Drafts / Overdue)
- View submissions per assignment
- Award marks (validated ≤ max marks) and write feedback
- Change submission status (Graded / Returned / Submitted / Late)

**Student**
- View published assignments for their class
- View details, deadline and remaining time
- Submit an answer (text) and an optional file
- Update a submission before the deadline (or if late is allowed)
- View submission status, marks and teacher feedback

**Platform**
- Public marketing landing page (navbar, hero, demo preview, features, giant footer wordmark)
- Role-specific sidebars and dashboards
- Dark / light mode, responsive layout, toast notifications, loading & empty states
- JWT sessions in http-only cookies, hashed passwords, server-enforced authorization
- In-app notifications (assignment published, new submission, submission graded) with a notification center + header bell
- Password reset via email (SMTP / Gmail app password) — forgot / reset pages
- Student self-registration (default role: student, redirects to the student dashboard)
- Sign out from the sidebar and the user menu

---

## Technology stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack) + React 19     |
| Language       | TypeScript                                        |
| Styling        | Tailwind CSS v4 + shadcn/ui (Base UI variant)     |
| Database       | PostgreSQL                                        |
| ORM            | Prisma 7 (driver adapter: `@prisma/adapter-pg`)   |
| Auth           | JWT (`jose`) in http-only cookies + RBAC          |
| Validation     | Zod                                               |
| Unit tests     | Vitest                                            |
| E2E tests      | Playwright                                        |
| Password hash  | bcryptjs                                          |

---

## Project structure

```
app/
  (auth flows)/login/                # Login page
  api/auth/{login,logout}/           # Auth route handlers
  actions/                            # Server Actions (mutations)
    assignments.ts  submissions.ts  admin.ts
  admin/                              # Admin area (layout + pages)
  teacher/                            # Teacher area
  student/                            # Student area
  page.tsx                            # Public landing page
  layout.tsx                          # Root layout (fonts, Toaster, Theme)
components/
  ui/                                 # shadcn/ui primitives
  layout/                             # AppShell, sidebar, header, page header
  marketing/                          # Landing page sections
  assignments/  admin/  dashboard/    # Feature components
lib/
  jwt.ts session.ts dal.ts password.ts roles.ts rules.ts prisma.ts
  validations/                        # Zod schemas
  generated/prisma/                   # Prisma client (generated)
proxy.ts                              # Next.js 16 proxy (route protection)
prisma/                               # schema.prisma + migrations + seed.ts
scripts/create-database.js            # Ensures the Postgres DB exists
tests/                                # Vitest unit + Playwright e2e
```

---

## Prerequisites

- **Node.js 20.19+** (tested on Node 22/24)
- **PostgreSQL 14+** running locally (default `localhost:5432`)
- npm

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd edumanager
npm install
```

### 2. Configure environment

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

`.env.local` (the values you must provide):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edumanager?schema=public"
JWT_SECRET="generate-with: openssl rand -base64 32"
JWT_EXPIRES="7d"
UPLOAD_DIR="public/uploads"
MAX_UPLOAD_MB="10"
NEXT_PUBLIC_APP_NAME="EduManager"

# SMTP / email (Gmail app password). Used for password-reset emails.
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=you@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM="EduManager <you@gmail.com>"
```

> If mail delivery fails (e.g. no network / invalid app password), the app logs
> the email it would have sent to the server console, so the reset flow stays
> testable. `.env.local` is git-ignored. `.env.example` is committed as a
> template.

### 3. Database setup

The project includes a helper that creates the database if it does not exist, so
you do **not** need to create tables or the database manually:

```bash
# Creates the DB (if missing) + applies migrations + seeds demo data
npm run db:setup
```

Or, step by step:

```bash
node scripts/create-database.js   # ensure the edumanager database exists
npx prisma migrate dev            # create tables (from prisma/migrations)
npm run db:seed                   # insert demo data
```

The seed creates the three demo accounts plus sample classes, subjects,
teacher/class mappings, assignments (draft + published) and a sample submission.

---

## Running the app

This is a single Next.js application (frontend + API together):

```bash
npm run dev      # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

Open <http://localhost:3000> — you will land on the public marketing page. Click
**Get started** (or go to `/login`) and sign in with a demo account.

---

## Demo credentials

| Role     | Email                   | Password     |
| -------- | ----------------------- | ------------ |
| Admin    | `admin@example.com`     | `Admin@123`  |
| Teacher  | `teacher@example.com`   | `Teacher@123`|
| Student  | `student@example.com`   | `Student@123`|

(On the login page you can click a role chip to auto-fill the credentials.)

---

## Running the tests

**Unit tests (Vitest)** — business rules & authorization logic:

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

**End-to-end tests (Playwright)** — login & RBAC flows. First time only,
install the browser:

```bash
npx playwright install chromium
npm run test:e2e
```

The e2e command automatically starts the dev server, runs the seed-confirmed
flows (sign-in for each role, protected-route redirect, role-based redirect,
teacher assignment navigation) and tears it down.

**Lint / type-check:**

```bash
npm run lint
npm run typecheck
```

---

## Database scripts

| Script                 | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run db:setup`     | Create DB + migrate + seed (one-shot)                     |
| `npm run db:migrate`   | Apply pending migrations (`prisma migrate dev`)           |
| `npm run db:seed`      | Insert/refresh demo data                                  |
| `npm run db:reset`     | Drop & recreate schema, then seed                         |
| `npm run prisma:generate` | Regenerate the Prisma client after schema changes      |

The migration files live in `prisma/migrations/` and the sample data in
`prisma/seed.ts`, so an evaluator can set up the database without creating
tables or collections manually.

---

## Assumptions

- One student belongs to exactly one class.
- One assignment belongs to one class + one subject and is created by one teacher.
- File uploads are optional, single-file, max 10 MB, stored on local disk
  (`public/uploads`). Allowed types: PDF, DOC/DOCX, TXT, MD, PNG/JPG/JPEG, ZIP.
- Late submissions are allowed only if the teacher explicitly enables them.
- Marks must be whole numbers in `[0, maxMarks]`.
- No real-time notifications (out of scope for this version).

---

## Known limitations

- File uploads use local disk (no cloud storage / S3).
- Single file per submission (multiple files not supported).
- No grade export to Excel/PDF.
- No attendance module, parent portal, or in-app messaging.
- The Prisma client is generated into `lib/generated/prisma` (Prisma 7 default);
  re-run `npm run prisma:generate` after any schema change.

---

## Feature status

This project implements the **MVP and core workflows** from the brief, plus the
notifications and password-reset additions. The aspirational list of ~150
features is **not** all implemented — the table below is honest about that.

**Implemented and working (verified by unit + e2e tests):**

- Admin: users (create / edit / activate-deactivate / delete), classes
  (create / delete, map subjects, assign teachers), subjects (create / delete),
  view all assignments & submissions, settings, dashboard, role & status
  indicators.
- Teacher: assignment create / edit / delete / publish / draft, filters
  (all / published / drafts / overdue), submissions per assignment, grading
  (marks ≤ max, feedback, status), dashboard.
- Student: published-assignment list, detail with deadline countdown, submit
  (text + optional file), edit before deadline, marks & feedback, my
  submissions, dashboard.
- Auth: login / logout, JWT sessions, role-based route protection (`proxy.ts`
  + Data Access Layer + every server action), **registration** (student), and
  **password reset via email**.
- Notifications: created on publish / submit / grade; header bell with unread
  badge + `/notifications` center with mark-all-read.

**Not implemented (out of scope for this build):** bulk CSV/Excel user import,
audit logs, system reports / analytics charts, announcements & Q&A, calendar
view, assignment file attachments from teachers, submission ZIP export, bulk
grading, email reminders / email for every event, notification preferences,
token refresh, rate limiting, CSRF tokens, soft-delete (users are hard-deleted),
and pagination on admin lists.

---

## Security notes

- Passwords are hashed with bcrypt (cost 10).
- Sessions are JWTs signed with `JWT_SECRET` and stored in an http-only,
  same-site=lax cookie (`secure` in production).
- Both an optimistic check in `proxy.ts` **and** secure checks in the Data Access
  Layer (`lib/dal.ts`) and every Server Action enforce role-based authorization.
- Students cannot see other students' submissions; teachers cannot access other
  teachers' assignments.

---

Built with Next.js, Prisma & shadcn/ui.
