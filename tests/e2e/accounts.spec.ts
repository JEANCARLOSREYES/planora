import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("registration, empty private workspace, export, logout, and login", async ({
  page,
  context,
}) => {
  const email = `planner-${Date.now()}@example.com`;
  const password = "My-personal-Planora-passphrase";
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/login$/);
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("New planner");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Your account is ready");
  await page.getByRole("link", { name: "Log in", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  const exported = await context.request.get("/api/account/export");
  expect(exported.ok()).toBeTruthy();
  expect(exported.headers()["cache-control"]).toBe("no-store");
  const data = await exported.json();
  expect(data.workspace.pages).toEqual([]);
  expect(data.workspace.tasks).toEqual([]);
  await page.goto("/workspace/settings");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem("planora:draft:test", "private draft"),
  );
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => localStorage.getItem("planora:draft:test")),
  ).toBeNull();
  expect((await context.request.get("/api/account/export")).status()).toBe(401);
  expect((await context.request.get("/api/search?q=test")).status()).toBe(401);
});

test("account pages are keyboard accessible and pass contrast checks", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/privacy",
  ]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, route).toEqual([]);
  }
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Planora", exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: test.info().outputPath("welcome.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: test.info().outputPath("register-mobile.png"),
    fullPage: true,
  });
});

test("a second account cannot view, overwrite, search, or export the first account's notes", async ({
  playwright,
}) => {
  const owner = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3100",
    extraHTTPHeaders: { Origin: "http://127.0.0.1:3100" },
  });
  const stranger = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3100",
    extraHTTPHeaders: { Origin: "http://127.0.0.1:3100" },
  });
  try {
    expect(
      (
        await owner.post("/api/auth/sign-in/email", {
          data: {
            email: "planner@example.com",
            password: "Planora-test-passphrase-2026",
          },
        })
      ).ok(),
    ).toBeTruthy();
    const original = await (await owner.get("/api/account/export")).json();
    const note = original.workspace.pages[0];
    expect(note).toBeTruthy();
    const email = `isolated-${Date.now()}@example.com`;
    expect(
      (
        await stranger.post("/api/auth/sign-up/email", {
          data: {
            email,
            name: "Another planner",
            password: "Separate-account-passphrase",
          },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await stranger.post("/api/auth/sign-in/email", {
          data: { email, password: "Separate-account-passphrase" },
        })
      ).ok(),
    ).toBeTruthy();
    const otherExport = await (
      await stranger.get("/api/account/export")
    ).json();
    expect(otherExport.workspace.ownerId).not.toBe(original.workspace.ownerId);
    expect(otherExport.workspace.pages).toEqual([]);
    const pageResponse = await stranger.get(`/workspace/page/${note.id}`);
    expect(await pageResponse.text()).not.toContain(note.title);
    const changed = await stranger.put(`/api/pages/${note.id}/content`, {
      data: {
        revision: note.revision,
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Unauthorized edit" }],
            },
          ],
        },
      },
    });
    // Saves deliberately use the same conflict response for an inaccessible,
    // deleted, or stale page, without disclosing whether a foreign ID exists.
    expect(changed.status()).toBe(409);
    const search = await (
      await stranger.get(`/api/search?q=${encodeURIComponent(note.title)}`)
    ).json();
    expect(JSON.stringify(search)).not.toContain(note.id);
    const after = await (await owner.get("/api/account/export")).json();
    expect(
      after.workspace.pages.find((page: { id: string }) => page.id === note.id),
    ).toEqual(note);
  } finally {
    await owner.dispose();
    await stranger.dispose();
  }
});
