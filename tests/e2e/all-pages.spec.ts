import { test, expect, type Browser, type Page } from "@playwright/test";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/dashboard/);
}

const ADMIN_PAGES = [
  { path: "/admin/dashboard", heading: "Dashboard" },
  { path: "/admin/users", heading: "Users" },
  { path: "/admin/classes", heading: "Classes" },
  { path: "/admin/subjects", heading: "Subjects" },
  { path: "/admin/assignments", heading: "Assignments" },
  { path: "/admin/submissions", heading: "Submissions" },
  { path: "/admin/settings", heading: "Settings" },
  { path: "/admin/profile", heading: "Profile" },
  { path: "/notifications", heading: "Notifications" },
];

const TEACHER_PAGES = [
  { path: "/teacher/dashboard", heading: "Dashboard" },
  { path: "/teacher/assignments", heading: "Assignments" },
  { path: "/teacher/assignments/create", heading: "New assignment" },
  { path: "/teacher/profile", heading: "Profile" },
];

const STUDENT_PAGES = [
  { path: "/student/dashboard", heading: "Dashboard" },
  { path: "/student/assignments", heading: "Assignments" },
  { path: "/student/submissions", heading: "My submissions" },
  { path: "/student/profile", heading: "Profile" },
];

async function roleContext(browser: Browser) {
  return { ctx: await browser.newContext(), page: null as Page | null };
}

test("public pages render", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Assignment management/ }),
  ).toBeVisible();

  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  await page.goto("/register");
  await expect(page.getByLabel("Full name")).toBeVisible();

  await page.goto("/forgot-password");
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("admin: every admin page renders", async ({ browser }) => {
  const { ctx } = await roleContext(browser);
  const page = await ctx.newPage();
  try {
    await login(page, "admin@example.com", "Admin@123");
    for (const p of ADMIN_PAGES) {
      await page.goto(p.path);
      await expect(
        page.getByRole("heading", { name: p.heading }),
      ).toBeVisible({ timeout: 10_000 });
    }

    // Admin assignment detail page (via the View link).
    await page.goto("/admin/assignments");
    const hrefs = await page
      .locator('a[href^="/admin/assignments/"]')
      .evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute("href") ?? ""),
      );
    const id = hrefs
      .map((h) => h.split("/").pop()!)
      .find((x) => /^\d+$/.test(x))!;
    await page.goto(`/admin/assignments/${id}`);
    await expect(page.locator("h1")).toBeVisible();
  } finally {
    await ctx.close();
  }
});

test("teacher: assignments, create, edit, and submissions pages render", async ({
  browser,
}) => {
  const { ctx } = await roleContext(browser);
  const page = await ctx.newPage();
  try {
    await login(page, "teacher@example.com", "Teacher@123");
    for (const p of TEACHER_PAGES) {
      await page.goto(p.path);
      await expect(
        page.getByRole("heading", { name: p.heading }),
      ).toBeVisible({ timeout: 10_000 });
    }

    // Open the first real assignment's edit + submissions pages (skip sidebar/nav links).
    await page.goto("/teacher/assignments");
    const hrefs = await page
      .locator('a[href^="/teacher/assignments/"]')
      .evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute("href") ?? ""),
      );
    const id = hrefs
      .map((h) => h.split("/").pop()!)
      .find((x) => /^\d+$/.test(x))!;

    await page.goto(`/teacher/assignments/${id}`);
    await expect(
      page.getByRole("heading", { name: "Edit assignment" }),
    ).toBeVisible();

    await page.goto(`/teacher/assignments/${id}/submissions`);
    await expect(
      page.getByRole("heading", { name: "Submissions" }),
    ).toBeVisible();
  } finally {
    await ctx.close();
  }
});

test("student: assignments, my submissions, and an assignment detail page render", async ({
  browser,
}) => {
  const { ctx } = await roleContext(browser);
  const page = await ctx.newPage();
  try {
    await login(page, "student@example.com", "Student@123");
    for (const p of STUDENT_PAGES) {
      await page.goto(p.path);
      await expect(
        page.getByRole("heading", { name: p.heading }),
      ).toBeVisible({ timeout: 10_000 });
    }

    await page.goto("/student/assignments");
    const hrefs = await page
      .locator('a[href^="/student/assignments/"]')
      .evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute("href") ?? ""),
      );
    const id = hrefs
      .map((h) => h.split("/").pop()!)
      .find((x) => /^\d+$/.test(x))!;
    await page.goto(`/student/assignments/${id}`);
    await expect(page.locator("h1")).toBeVisible();
  } finally {
    await ctx.close();
  }
});
