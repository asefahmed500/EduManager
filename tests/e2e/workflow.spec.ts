import { test, expect, type Browser, type Page } from "@playwright/test";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/dashboard/);
}

test("full flow: teacher creates & publishes, student submits, teacher grades, student sees feedback", async ({
  browser,
}: {
  browser: Browser;
}) => {
  const teacherCtx = await browser.newContext();
  const teacher = await teacherCtx.newPage();
  const studentCtx = await browser.newContext();
  const student = await studentCtx.newPage();

  try {
    // ---------- Teacher creates + publishes ----------
    await login(teacher, "teacher@example.com", "Teacher@123");
    await teacher.getByRole("link", { name: "Assignments" }).first().click();
    await teacher.waitForURL("**/teacher/assignments");
    await teacher.getByRole("button", { name: /New assignment/ }).click();

    const title = `E2E Integration Assignment ${Date.now()}`;
    await teacher.getByLabel("Title").fill(title);
    await teacher.getByLabel("Description").fill("Please submit your work.");
    await teacher.getByLabel("Deadline").fill("2030-12-31T23:59");

    await teacher.getByRole("combobox").click();
    await teacher
      .getByRole("option", { name: /Grade 10 - A.*Mathematics/ })
      .click();

    await teacher.getByRole("button", { name: "Publish", exact: true }).click();
    await teacher.waitForURL(/\/teacher\/assignments\/\d+$/);
    const assignmentId = teacher.url().split("/").pop();

    // ---------- Student submits ----------
    await login(student, "student@example.com", "Student@123");
    await student.getByRole("link", { name: "Assignments" }).first().click();
    await student.waitForURL("**/student/assignments");
    await student.getByRole("link", { name: new RegExp(title) }).click();
    await student.waitForURL(`**/student/assignments/${assignmentId}`);

    await student.getByLabel("Your answer").fill("Here is my submission.");
    await student.getByRole("button", { name: /Submit work/ }).click();
    await expect(student.getByText("Submission saved.")).toBeVisible();

    // ---------- Teacher grades ----------
    await teacher.goto(`/teacher/assignments/${assignmentId}/submissions`);
    await teacher.getByRole("link", { name: "Alex Johnson" }).click();
    await teacher.getByLabel(/Marks/).fill("45");
    await teacher.getByLabel("Feedback").fill("Nice work!");
    await teacher.getByRole("button", { name: "Save grade" }).click();
    await expect(teacher.getByText("Grade saved.")).toBeVisible();

    // ---------- Student sees marks + feedback ----------
    await student.goto(`/student/assignments/${assignmentId}`);
    await expect(student.getByText("45/100")).toBeVisible();
    await expect(student.getByText("Nice work!")).toBeVisible();
  } finally {
    await teacherCtx.close();
    await studentCtx.close();
  }
});

