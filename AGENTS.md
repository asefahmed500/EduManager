<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# EduManager — repo-specific guidance

Next.js **16.2.6** (App Router, Turbopack) · React 19 · TS · Tailwind v4 · shadcn/ui **Base UI variant** · Prisma 7 · PostgreSQL.

## Commands
- `npm run dev` — dev server (reads `.env.local`).
- Verification order that matters: `npm run lint` → `npm run typecheck` → `npm test` → `npm run test:integration` → `npm run test:e2e` → `npm run build`.
- `npm run db:setup` (create DB + migrate + seed), `db:migrate`, `db:seed`, `db:reset`. DB creation is automated via `scripts/create-database.js` — no manual `psql` needed.
- `npx prisma generate` regenerates the client (`postinstall` also runs it).

## Next.js 16 gotchas (agents miss these)
- **Middleware is `proxy.ts`** at repo root (not `middleware.ts`). It does optimistic auth redirects only; real authorization is re-checked in the Data Access Layer and every Server Action.
- **`cookies()`, `headers()`, route `params`, and `searchParams` are async** — always `await` them.
- Role areas are **real URL segments**: `app/admin`, `app/teacher`, `app/student` each have their own `layout.tsx` (server component calling `requireRole` + rendering `<AppShell>`). Do NOT use route groups for these (groups add no segment and would collide at `/dashboard`).
- Auth split: `lib/jwt.ts` (pure `jose` encrypt/decrypt — the only auth module safe to import in `proxy.ts`), `lib/session.ts` (`server-only`; http-only cookie), `lib/dal.ts` (`verifySession`/`getCurrentUser`/`requireRole`, uses React `cache`). Keep this split.

## shadcn/ui Base UI gotchas (NOT Radix)
- Use the **`render` prop**, never `asChild` (e.g. `<SidebarMenuButton render={<Link href="..." />} />`).
- `<Button render={<Link href="..." />} />` must also pass **`nativeButton={false}`**, or Base UI logs a warning and changes the element's role.
- **`DropdownMenuLabel`/`DropdownMenuItem` must be wrapped in `DropdownMenuGroup`** — otherwise Base UI throws `MenuGroupContext is missing` and crashes the page.
- Toasts use Base UI's manager: there is **no `toast.success()/toast.error()`**. Use `notify.*` from `@/lib/toast` (wraps `toast.add({ type, description, title })`). `<Toaster />` is already mounted in the root layout.
- No `form.tsx`; use `field.tsx` (`Field`, `FieldLabel`, `FieldError`) + `input.tsx`/`select.tsx`/`textarea.tsx`. `Select`/`Checkbox` submit via `name` + hidden inputs; the assignment form keeps a hidden input synced to a controlled Select for reliability.
- **`SelectValue` shows the raw `value` (e.g. an id number) by default** — not the item's label. Always pass a function child: `<SelectValue>{(v) => v ? labelMap[v] ?? v : "Placeholder"}</SelectValue>`. The `DataFilters`, `ClassManager`, `AssignmentForm`, `UserFormDialog`, and `GradeForm` all use this pattern.
- **Single font system: Inter only.** `font-serif` is mapped to Inter (`globals.css`); H1–H3 get weight 600 + negative tracking from the base layer. Do not add another font family.

## Prisma 7 gotchas
- **Driver adapter required** — never `new PrismaClient()` bare. `lib/prisma.ts` uses `new PrismaPg({ connectionString })` from `@prisma/adapter-pg`.
- `DATABASE_URL` comes from **`prisma.config.ts`** (loads `.env.local`); the schema has **no `url` in `datasource`**.
- Generated client lives in **`lib/generated/prisma`** (gitignored; import from `@/lib/generated/prisma/client`; enums are string unions).
- **`prisma migrate dev` refuses to run in non-interactive shells** (e.g. when a change triggers a warning prompt). To add a migration here, write the SQL manually into `prisma/migrations/<timestamp>_<name>/migration.sql`, then `npx prisma migrate deploy` + `npx prisma generate`.
- `lib/generated/**` is excluded from eslint + prettier.

## Tests (three tiers)
- **Unit:** `npm test` (Vitest) — pure business rules in `lib/rules.ts`, tested in `tests/business-rules.test.ts`. Keep the 7 PRD rules and `lib/rules.ts` in sync with the Server Actions.
- **Integration:** `npm run test:db:setup` (creates/migrates/seeds `edumanager_test`) then `npm run test:integration` (`vitest.integration.config.ts`). Requires `TEST_DATABASE_URL` in `.env.local`. Setup (`tests/integration/setup.ts`) mocks `next/headers`, `next/navigation`, `next/cache`, React `cache`, and `server-only`, and **hard-refuses to run against a non-`_test` DB**. Exercises real Server Actions + Route Handlers against Postgres.
- **E2E:** `npx playwright install chromium` once, then `npm run test:e2e`. Auto-starts `next dev` (reuses a running one); the dev DB must be seeded. Suite: `auth.spec.ts` (login/RBAC/register/sign-out), `workflow.spec.ts` (create → publish → submit → grade → feedback), `all-pages.spec.ts` (visits every page for every role and asserts it renders).
- E2E locator gotcha: **the Base UI sidebar is also `<ul><li><a>`**, so `locator("li a")` matches nav items before page content. Scope to content or filter by href (e.g. `a[href^="/teacher/assignments/"]`, then keep the segment that is all digits).
- Multi-role flows use **separate browser contexts** (cookies persist per context; the proxy redirects logged-in users away from `/login`, so you can't switch users by re-visiting `/login` in the same context).

## Architecture & data model
- Hybrid backend: **Route Handlers** (`app/api`) for auth (login/register/forgot/reset) + notifications; **Server Actions** (`app/actions/{assignments,submissions,admin}.ts`) for all mutations. Every mutation re-validates via `requireRole` + ownership — proxy is not the only defense.
- Key relations: `User.classId` (students → one Class); `ClassSubject` maps class↔subject; `TeacherSubjectClass` assigns a teacher to a class+subject pair (controls what assignments a teacher can create); `Submission` is unique per `(assignmentId, studentId)`.
- Business rules live in `lib/rules.ts` (visibility, deadline/edit, marks ≤ max, teacher ownership, role access) and are called by the actions.
- File uploads: single file ≤10 MB to `public/uploads` (gitignored), type/size validated in `submitAssignment`.

## Env & secrets
- `.env.local` is the single source for Next.js and Prisma (via `prisma.config.ts`). `.env.example` is committed with placeholders; `.env.local` is git-ignored. Never commit real values.
- Password-reset email uses nodemailer (SMTP vars). If SMTP fails, `lib/mailer.ts` logs the would-be email to the server console — the reset flow stays testable offline.
