# EduManager

**Assignment & Submission Management System**

A premium, role-based platform for schools and colleges — teachers create assignments, students submit work, and admins manage everything. Built with Next.js 16, React 19, Prisma 7, and PostgreSQL.

---

## Table of Contents

- [Demo Credentials](#demo-credentials)
- [Technology Stack](#technology-stack)
- [Feature Documentation](#feature-documentation)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Database Setup](#database-setup)
- [Running the App](#running-the-app)
- [Running the Tests](#running-the-tests)
- [Environment Configuration](#environment-configuration)
- [Assumptions](#assumptions)
- [Known Limitations](#known-limitations)

---

## Demo Credentials

| Role     | Email                   | Password      |
| -------- | ----------------------- | ------------- |
| Admin    | `admin@example.com`     | `Admin@123`   |
| Teacher  | `teacher@example.com`   | `Teacher@123` |
| Student  | `student@example.com`   | `Student@123` |

> On the login page, click a role chip to auto-fill credentials.

---

## Technology Stack

| Layer         | Technology                                            |
| ------------- | ----------------------------------------------------- |
| Framework     | Next.js 16.2.6 (App Router, Turbopack)                |
| UI            | React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui   |
| Database      | PostgreSQL                                             |
| ORM           | Prisma 7 (driver adapter: `@prisma/adapter-pg`)       |
| Auth          | JWT (`jose`) in http-only cookies + role-based access |
| Validation    | Zod v4                                                 |
| Email         | Nodemailer (SMTP / Gmail app password)                |
| Unit tests    | Vitest (20 tests)                                      |
| Integration   | Vitest + real test database (24 tests)                |
| E2E tests     | Playwright (13 tests)                                  |

---

## Feature Documentation

Every feature below is implemented, tested, and fully functional.

### Authentication & Authorization

**Login** — Users sign in with email + password. The password is verified against a bcrypt hash. On success, a JWT (signed with `jose`) is set in an http-only cookie (`edumanager_session`, 7-day expiry). The response includes the user's role and dashboard redirect URL.

**Registration** — Any visitor can register at `/register`. New accounts default to the **Student** role (no class assigned — the admin assigns one later). After registration, the user is automatically logged in and redirected to `/student/dashboard`.

**Password Reset** — At `/forgot-password`, the user enters their email. If an active account exists, a random 32-byte token is generated, stored on the `User` record (`resetToken` + `resetTokenExpires`, 1-hour expiry), and emailed via Nodemailer. The user clicks the link in the email to reach `/reset-password?token=...`, enters a new password, and the token is cleared. If SMTP is not configured or fails, the would-be email is logged to the server console so the flow stays testable offline.

**Logout** — Available from both the user menu (top-right dropdown) and the sidebar footer. Deletes the session cookie and redirects to `/login`.

**Role-Based Access Control** — Three layers of protection:
1. **Proxy** (`proxy.ts`) — Next.js 16's renamed middleware. Does optimistic checks: unauthenticated users visiting role areas (`/admin/*`, `/teacher/*`, `/student/*`, `/notifications`) are redirected to `/login`. Authenticated users visiting `/login` or `/register` are bounced to their dashboard. Role mismatches (e.g. student visiting `/admin`) redirect to the user's own dashboard.
2. **Data Access Layer** (`lib/dal.ts`) — `requireRole(...roles)` is called by every Server Action and route handler. It verifies the session, fetches the user from the database (excluding soft-deleted accounts), and redirects if the role doesn't match.
3. **Ownership checks** — Server Actions verify the caller owns the resource (e.g. a teacher can only edit/grade their own assignments; a student can only see their own class's assignments).

**JWT Sessions** — Tokens are signed with `JWT_SECRET` using HS256. The payload contains `userId`, `role`, and `expiresAt`. The `jose` library handles signing/verification. The JWT module (`lib/jwt.ts`) is pure (no `server-only`, no `cookies`) so it can be safely imported in both `proxy.ts` and server components.

### Admin Features

**User Management** (`/admin/users`)
- **View all users** — Paginated list (10 per page) showing name, email, role, status (Active/Inactive badge), and class.
- **Search** — Search by name or email (debounced input, server-side `contains` + `mode: insensitive`).
- **Filter** — Dropdown filters for Role (Admin/Teacher/Student) and Status (Active/Inactive), via the shared `DataFilters` component.
- **Add user** — Dialog form with name, email, password (min 6 chars), role, and class (for students). Password is bcrypt-hashed before storage.
- **Edit user** — Same dialog, pre-filled. Email uniqueness is validated (excluding the current user). Password is optional (leave blank to keep). The `isActive` field preserves its current value if the form omits it.
- **Activate/Deactivate** — Toggle button per row. Deactivated users cannot log in.
- **Delete user** — Soft-delete: sets `isDeleted = true` + `isActive = false`. The account stays in the database (for audit/history) but is excluded from login, forgot-password, the DAL, and admin lists.
- **View profile** — Eye-icon button opens a read-only dialog showing role, status, class, join date, and activity counts (submissions for students, assignments created for teachers).

**Class/Course Management** (`/admin/classes`)
- **Create class** — Simple form with name + description.
- **Edit class** — Edit dialog with name + description.
- **Delete class** — Hard delete (cascade removes ClassSubject + TeacherSubjectClass).
- **Map subjects to classes** — Each class card has a "Add subject" dropdown. Selecting a subject creates a `ClassSubject` record linking the class and subject.
- **Assign teachers** — Each mapped subject shows assigned teachers (as badges) and an "Assign teacher" dropdown. Selecting a teacher creates a `TeacherSubjectClass` record. Teachers can be unassigned with the X button on their badge.
- **Remove mapping** — Each subject can be removed from the class via the X button on the subject card.

**Subject Management** (`/admin/subjects`)
- **Create subject** — Simple form with name + optional code.
- **Edit subject** — Edit dialog with name + code.
- **Delete subject** — Hard delete.

**System Overview**
- **View all assignments** (`/admin/assignments`) — Paginated list with dropdown filters (class, subject, teacher) + search by title + status badge. Each row links to a detail page showing the full assignment description + all submissions.
- **View all submissions** (`/admin/submissions`) — Paginated list with status dropdown filter. Assignment titles link to the admin assignment detail page.
- **Assignment detail** (`/admin/assignments/[id]`) — Full assignment info (description, deadline, max marks, late policy, status) + list of all submissions with student names, timestamps, marks, and statuses.
- **Settings** (`/admin/settings`) — Key-value editor for `siteName`, `academicYear`, `maxUploadMb`, `allowLateDefault`, `notificationInApp`, `notificationEmail`. The `maxUploadMb` value is read at runtime in the submission action (falls back to `MAX_UPLOAD_MB` env).
- **Dashboard** (`/admin/dashboard`) — System-wide stats (users, teachers, students, classes, subjects, assignments, submissions) + recent assignments list.

### Teacher Features

**Assignment Management** (`/teacher/assignments`)
- **Create assignment** — Form with title (min 3 chars), description (required), class+subject (dropdown of the teacher's assigned class-subject pairs only), deadline (datetime-local, must be future), max marks (positive integer), allow-late toggle, and save-as-draft or publish buttons. On publish, all students in the class receive an in-app notification.
- **View assignments** — List with filter chips (All / Published / Drafts / Overdue) showing title, class, subject, deadline, submission count, and status badge. Each row has a dropdown menu (View/Edit, Publish/Unpublish, Duplicate, Delete).
- **Edit assignment** — Same form, pre-filled. Re-publishing sends notifications again.
- **Delete assignment** — Hard delete (cascade removes submissions).
- **Publish/Unpublish** — Toggle between DRAFT and PUBLISHED. Only published assignments are visible to students.
- **Duplicate** — Creates a copy as a DRAFT with "(Copy)" appended to the title.
- **Business rule enforcement** — Teachers can only create assignments for class-subject pairs they're assigned to (verified via `TeacherSubjectClass`). Editing an assignment outside their ownership returns "Assignment not found."

**Submission Management** (`/teacher/assignments/[id]/submissions`)
- **View submissions** — List of all submissions for an assignment, with status dropdown filter and student-name search. Each row links to the grade page.
- **Grade submission** (`/teacher/assignments/[id]/submissions/[submissionId]`) — Shows the student's text answer + file download link, plus a grading form: marks (0 to maxMarks, validated), feedback (textarea), and status dropdown (Graded / Returned / Submitted / Late, defaulting to Graded). On save, the student receives an in-app notification.
- **Business rules** — Marks cannot exceed `maxMarks` (server-side `isMarksValid` check). Teachers can only grade submissions of their own assignments (ownership verified).

**Teacher Dashboard** (`/teacher/dashboard`)
- Quick-action cards: Manage assignments, Grade submissions (with pending count), Check deadlines.
- Stats: total / published / drafts / awaiting grading.
- Upcoming deadlines (published assignments, future deadline, sorted ascending).
- Awaiting grading (submissions with status SUBMITTED).
- My classes & subjects (assigned class-subject pairs, clickable).

**Teacher Profile** (`/teacher/profile`) — Identity card (avatar, name, email, role badge), account details (role, status, join date), overview stats (assignments, published, awaiting grading, class-subject pairs), and an edit form (name, email, change password with current-password verification).

### Student Features

**Assignment Viewing** (`/student/assignments`)
- **View published assignments** — Only assignments with `status: PUBLISHED` for the student's class (`classId` match). Students never see drafts or other classes' assignments.
- **Search** — Search by title (server-side `contains`).
- **Filter** — Status chips: All / Active (future deadline, not graded) / Past (deadline passed) / Graded.
- **Assignment detail** (`/student/assignments/[id]`) — Full brief (description, deadline with countdown, max marks, late policy, status badge), status sidebar (deadline, time remaining, submission status), submission form or graded result.

**Submission Management**
- **Submit** — Text answer (textarea) + optional file upload (single file, max 10 MB from settings, allowed types: PDF/DOC/DOCX/TXT/MD/PNG/JPG/JPEG/ZIP). File is validated server-side (size + extension), stored in `public/uploads/`, and the URL is saved on the submission.
- **Edit before deadline** — Students can update their submission before the deadline (or after if `allowLate` is enabled). Once graded, editing is blocked.
- **Delete submission** — Students can delete their own submission before the deadline (or if allow-late). Graded submissions cannot be deleted.
- **Late submissions** — If the deadline has passed and `allowLate` is false, submission is blocked. If `allowLate` is true, the submission is marked with status `LATE`.
- **Status tracking** — Submission status flows: `NOT_SUBMITTED` → `SUBMITTED` (or `LATE`) → `GRADED` (or `RETURNED`).

**Student Dashboard** (`/student/dashboard`)
- Quick-action cards: Open assignments (with pending count), My submissions, Recent feedback.
- Stats: open assignments, submitted, graded, feedback count.
- Assignments list with per-row action buttons (Submit / Edit / View depending on state).
- Recent feedback (graded submissions with feedback text).
- Empty state with guidance if the student isn't assigned to a class.

**Student Profile** (`/student/profile`) — Same layout as teacher profile with student-specific stats (submissions, graded, unread notifications).

### Cross-Cutting Features

**Notifications** — A `Notification` model stores per-user messages (title, message, type, link, read flag). Notifications are created via `lib/notify.ts` (`createNotifications`) on three events:
1. **Assignment published** → all students in the class get a notification with a link to the assignment.
2. **Submission submitted** → the assignment's teacher gets a notification.
3. **Submission graded** → the student gets a notification with marks/feedback summary.

The header **bell icon** shows an unread count badge. Opening the dropdown marks all as read and lists recent notifications. A full `/notifications` page lists all notifications with mark-all-read.

**Dropdown Filters** — The shared `DataFilters` component renders a search box + Base UI Select dropdowns + a Clear button. On change, it pushes new URL search params (preserving other filters, resetting page to 1). Used on admin users, admin assignments, admin submissions, and teacher submissions.

**Pagination** — The shared `Pagination` component renders Prev/Next + "Page X of Y · N total". Uses `buildUrl` from `lib/url.ts` to preserve existing query params. 10 items per page on all admin lists.

**Profile Pages** — Every role has a profile page under their role layout (`/admin/profile`, `/teacher/profile`, `/student/profile`) so the sidebar renders. The shared `ProfileView` component shows identity, account details, role-specific stats, and an edit form (name, email, change password with current-password verification via `app/actions/profile.ts`).

**Landing Page** (`/`) — Public marketing page with a floating pill navbar (detached from top, subtle shadow on scroll), hero section with CTA buttons + GitHub source link, a rich demo dashboard preview (mock sidebar + stats + quick actions + assignments table), features grid, role sections, how-it-works steps, CTA section, and a giant "EduManager" footer wordmark.

**Register** (`/register`) — Public registration page. New users are created as Students (no class). Redirects to `/student/dashboard` after registration. Linked from the login page.

**Password Reset** (`/forgot-password` + `/reset-password`) — Email-based reset flow with 1-hour token expiry.

### Security

- **Password hashing** — bcryptjs (cost factor 10). Passwords are never stored or logged in plain text.
- **JWT in http-only cookies** — Tokens are not accessible to client-side JavaScript. `secure` flag is set in production. `sameSite: lax`.
- **Server-side validation** — All forms and API endpoints validate with Zod schemas before processing.
- **SQL injection protection** — Prisma parameterized queries throughout.
- **Authorization** — Every mutation re-checks the user's role AND ownership of the resource.
- **Soft-delete** — Deleted users are flagged (`isDeleted`), not removed. They can't log in or appear in lists.

---

## Project Structure

```
app/
  (root)
  layout.tsx                        # Root layout (Inter font, ThemeProvider, Toaster)
  page.tsx                           # Public landing page
  proxy.ts (at repo root)            # Next.js 16 middleware (auth redirects)
  login/                             # Login page
  register/                          # Student registration
  forgot-password/                   # Request password reset
  reset-password/                    # Reset password with token
  notifications/                     # Notification center (all roles)
  admin/
    layout.tsx                       # Admin layout (requireRole + AppShell)
    dashboard/                       # Admin dashboard
    users/                           # User management (CRUD + filters + pagination)
    classes/                         # Class management (CRUD + subject mapping + teacher assignment)
    subjects/                        # Subject management (CRUD)
    assignments/                     # All assignments (filters + detail page)
    submissions/                     # All submissions (filter + pagination)
    settings/                        # Application settings
    profile/                         # Admin profile
  teacher/
    layout.tsx                       # Teacher layout
    dashboard/                       # Teacher dashboard
    assignments/                     # Assignment CRUD + filters
    assignments/[id]/                # Edit assignment
    assignments/[id]/submissions/    # Submissions list + grade page
    assignments/create/              # New assignment form
    profile/                         # Teacher profile
  student/
    layout.tsx                       # Student layout
    dashboard/                       # Student dashboard
    assignments/                     # Assignment list (filter + search)
    assignments/[id]/                # Assignment detail + submit form
    submissions/                     # My submissions
    profile/                         # Student profile
  api/
    auth/
      login/                         # POST login
      logout/                        # POST logout
      register/                      # POST register
      forgot-password/               # POST request reset
      reset-password/                # POST reset with token
    notifications/                   # GET notifications + POST mark-read
  actions/
    assignments.ts                   # Server Actions: CRUD + publish + duplicate
    submissions.ts                   # Server Actions: submit + grade + delete
    admin.ts                         # Server Actions: users + classes + subjects + settings
    profile.ts                       # Server Actions: update profile + change password

components/
  ui/                                # shadcn/ui Base UI primitives (60 components)
  layout/                            # AppShell, sidebar, header, DataFilters, Pagination
  marketing/                         # Landing page sections (navbar, demo preview, footer)
  assignments/                       # Assignment form, grade form, submission form, row actions
  admin/                             # User dialog, edit dialog, class manager, settings editor
  dashboard/                         # StatCard, status badges
  profile/                           # ProfileView, ProfileForm
  notifications/                     # MarkAllRead button

lib/
  jwt.ts                             # Pure jose encrypt/decrypt (safe for proxy.ts)
  session.ts                         # Cookie-based session (server-only)
  dal.ts                             # Data Access Layer: verifySession, getCurrentUser, requireRole
  password.ts                        # bcrypt hash/verify (server-only)
  prisma.ts                          # Prisma client singleton (driver adapter)
  rules.ts                           # Pure business-rule predicates (unit-tested)
  roles.ts                           # Role → dashboard URL mapping
  notify.ts                          # createNotifications helper
  mailer.ts                          # Nodemailer sendMail with graceful fallback
  toast.ts                           # notify.success/error/info/warning (Base UI wrapper)
  url.ts                             # buildUrl for preserving query params
  forms.ts                           # FormState type
  validations/                       # Zod schemas (auth, assignment, submission)

prisma/
  schema.prisma                      # Full schema (9 models + 3 enums)
  migrations/                        # SQL migration files
  seed.ts                            # Demo data seeder

scripts/
  create-database.js                 # Ensures the PostgreSQL database exists
  setup-test-db.js                   # Creates + migrates + seeds the test database

tests/
  business-rules.test.ts             # Unit tests (20) — pure rule predicates
  integration/                       # Integration tests (24) — real DB, mocked session
  e2e/                               # Playwright E2E (13) — browser flows
```

---

## Local Setup

### Prerequisites

- **Node.js 20+** (tested on Node 22/24)
- **PostgreSQL 14+** running on `localhost:5432`
- npm

### 1. Clone and install

```bash
git clone https://github.com/asefahmed500/EduManager.git
cd EduManager
npm install
```

> `postinstall` automatically runs `prisma generate` to create the Prisma client.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values (see [Environment Configuration](#environment-configuration)).

### 3. Database setup

```bash
npm run db:setup
```

This single command:
1. Creates the `edumanager` database (if it doesn't exist) via `scripts/create-database.js`.
2. Applies all migrations (`prisma migrate deploy`).
3. Seeds demo data (admin, teacher, student accounts + classes, subjects, assignments, submissions, notifications).

No manual `psql` or table creation is needed.

---

## Environment Configuration

`.env.local` (git-ignored — never committed). `.env.example` is committed with placeholders:

```bash
# PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edumanager?schema=public"

# Separate database for integration tests
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edumanager_test?schema=public"

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET="your-secret-key"
JWT_EXPIRES="7d"

# SMTP (Gmail app password) — used for password-reset emails
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=you@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM="EduManager <you@gmail.com>"

# File uploads
MAX_UPLOAD_MB="10"

# App
NEXT_PUBLIC_APP_NAME="EduManager"
```

> If SMTP is not configured, password-reset emails are logged to the server console instead of being sent.

---

## Running the App

This is a single Next.js application (frontend + API + Server Actions together):

```bash
npm run dev      # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

Open `http://localhost:3000` — you'll see the landing page. Click **Get started** or go to `/login` and sign in with a demo account.

---

## Running the Tests

### Unit tests (Vitest, 20 tests)

Pure business-rule predicates in `lib/rules.ts`:

```bash
npm test
```

### Integration tests (Vitest + real database, 24 tests)

Exercises real Server Actions + Route Handlers against a dedicated `edumanager_test` PostgreSQL database. Covers auth, authorization guards, admin CRUD, teacher assignment lifecycle, student submission + grading, and notifications.

```bash
npm run test:db:setup    # Creates + migrates + seeds the test DB (first time only)
npm run test:integration
```

> The integration suite **refuses to run against a non-`_test` database** to protect dev data.

### End-to-end tests (Playwright, 13 tests)

Browser-level flows: 3-role login, RBAC redirects, register, sign-out, full create→publish→submit→grade→feedback workflow, and every-page-renders coverage.

```bash
npx playwright install chromium    # First time only
npm run test:e2e                   # Auto-starts dev server
```

### Lint & type-check

```bash
npm run lint
npm run typecheck
```

---

## Assumptions

1. One student belongs to exactly one class.
2. One assignment belongs to one class + one subject, created by one teacher.
3. File uploads are single-file, max 10 MB, stored on local disk (`public/uploads/`).
4. Late submissions are allowed only if the teacher explicitly enables `allowLate` on the assignment.
5. Marks must be whole numbers in `[0, maxMarks]`.
6. New registrations default to the Student role with no class assigned.
7. Deleted users are soft-deleted (`isDeleted`), not removed from the database.

---

## Known Limitations

- File uploads use local disk (no cloud storage / S3).
- Single file per submission (multiple files not supported).
- No grade export to Excel/PDF.
- No bulk CSV/Excel user import.
- No audit logs or system reports/analytics.
- No announcements, Q&A, or calendar view.
- No bulk grading or ZIP export of submissions.
- Email notifications are limited to password reset (in-app notifications cover publish/submit/grade events).
- No token refresh mechanism (JWT expires after 7 days).
- No rate limiting or CSRF tokens.
- No Docker containerization or CI/CD pipeline.
- No Swagger/OpenAPI documentation.
- Admin lists paginate but do not support server-side sorting by column.
