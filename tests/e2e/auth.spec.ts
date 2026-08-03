import { test, expect } from "@playwright/test";

const DEMO = [
  {
    role: "admin",
    email: "admin@example.com",
    password: "Admin@123",
    dashboard: "/admin/dashboard",
  },
  {
    role: "teacher",
    email: "teacher@example.com",
    password: "Teacher@123",
    dashboard: "/teacher/dashboard",
  },
  {
    role: "student",
    email: "student@example.com",
    password: "Student@123",
    dashboard: "/student/dashboard",
  },
] as const;

for (const user of DEMO) {
  test(`${user.role} can sign in and reach their dashboard`, async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(user.dashboard);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });
}

test("unauthenticated users are redirected from protected areas to /login", async ({
  page,
}) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("students cannot reach the admin area (role-based redirect)", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByLabel("Password").fill("Student@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/student/dashboard");

  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/student\/dashboard/);
});

test("teacher assignment create flow is reachable", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("teacher@example.com");
  await page.getByLabel("Password").fill("Teacher@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/teacher/dashboard");

  await page.getByRole("link", { name: "Assignments" }).first().click();
  await page.waitForURL("**/teacher/assignments");
  await page.getByRole("button", { name: /New assignment/ }).click();
  await expect(
    page.getByRole("heading", { name: "New assignment" }),
  ).toBeVisible();
});

test("a new user can register as a student and lands on the student dashboard", async ({
  page,
}) => {
  const email = `new.student.${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("New Student");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password@123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/student/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard" }),
  ).toBeVisible();
});

test("sign out returns to the login page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByLabel("Password").fill("Student@123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/student/dashboard");
  await page.getByText("Sign out", { exact: false }).click();
  await expect(page).toHaveURL(/\/login/);
});
