import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function createPage(page: Page, title: string) {
  await page.getByRole("button", { name: "Quick create page" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Page title").fill(title);
  await dialog
    .getByRole("button", { name: "Create page", exact: true })
    .click();
  await expect(
    page.getByRole("main").getByLabel("Page title", { exact: true }),
  ).toHaveValue(title);
  await expect(
    page.getByRole("textbox", { name: "Page content" }),
  ).toBeVisible();
}
let sessionCookies: Awaited<ReturnType<BrowserContext["cookies"]>>;
test.beforeAll(async ({ request }) => {
  const response = await request.post("/api/auth/sign-in/email", {
    headers: { Origin: "http://127.0.0.1:3100" },
    data: {
      email: "planner@example.com",
      password: "Planora-test-passphrase-2026",
    },
  });
  expect(response.ok()).toBeTruthy();
  sessionCookies = (await request.storageState()).cookies;
});
test.beforeEach(async ({ page, context }) => {
  await context.addCookies(sessionCookies);
  await page.goto("/workspace");
});

test("appearance palettes, reading controls and reset persist", async ({
  page,
}) => {
  await page.goto("/workspace/settings");
  await page.getByRole("button", { name: "Ocean", exact: true }).click();
  await page.getByLabel("Reading font", { exact: true }).selectOption("serif");
  await page.getByLabel("Reading size", { exact: true }).selectOption("large");
  await page.getByLabel("Motion", { exact: true }).selectOption("reduced");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "ocean");
  await expect(page.getByLabel("Reading font", { exact: true })).toHaveValue(
    "serif",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-reading-size",
    "large",
  );
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  for (const mode of ["Light", "Dark"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    for (const palette of ["Lavender", "Ocean", "Forest", "Rose"]) {
      await page.getByRole("button", { name: palette, exact: true }).click();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    }
  }
  await page.screenshot({
    path: "test-results/appearance-rose.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Restore default appearance" })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-palette",
    "lavender",
  );
  await expect(page.getByLabel("Reading font", { exact: true })).toHaveValue(
    "sans",
  );
});

test("pages, rich text, slash commands, autosave, favorites, and hierarchy", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await createPage(page, "E2E Writing room");
  const url = page.url();
  const editor = page.getByRole("textbox", { name: "Page content" });
  await editor.fill("A durable idea.");
  await expect(
    page.getByRole("status").filter({ hasText: /^Saved$/ }),
  ).toBeVisible();
  await editor.press("End");
  await editor.press("Enter");
  await editor.pressSequentially("/heading");
  await expect(
    page.getByRole("listbox", { name: "Block commands" }),
  ).toBeVisible();
  await editor.press("ArrowDown");
  await editor.press("Enter");
  await editor.pressSequentially("A clear direction");
  await expect(editor.locator("h2")).toHaveText("A clear direction");
  await expect(
    page.getByRole("status").filter({ hasText: /^Saved$/ }),
  ).toBeVisible();
  await page.reload();
  await expect(editor).toContainText("A durable idea.");
  await expect(editor.locator("h2")).toHaveText("A clear direction");
  await page
    .getByRole("button", { name: "Add to favorites", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove from favorites" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add a nested page", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Page title")
    .fill("E2E Nested plan");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create page", exact: true })
    .click();
  await expect(
    page.getByRole("main").getByLabel("Page title", { exact: true }),
  ).toHaveValue("E2E Nested plan");
  await page.getByRole("button", { name: "Page actions", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Page properties", exact: true })
    .click();
  await page.getByRole("dialog").getByLabel("Location").selectOption("");
  await page.getByRole("dialog").getByLabel("Page icon").fill("🎯");
  await page
    .getByRole("dialog")
    .getByLabel("Title", { exact: true })
    .fill("E2E Renamed plan");
  await page
    .getByRole("dialog")
    .getByLabel("Visual header")
    .selectOption("forest");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes" })
    .click();
  await expect(page.locator(".document-cover")).toHaveClass(/cover-forest/);
  await page.reload();
  await expect(
    page.getByRole("main").getByLabel("Page title", { exact: true }),
  ).toHaveValue("E2E Renamed plan");
  await page.goto(url);
  await page.getByRole("button", { name: "Page actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Duplicate page" }).click();
  await expect(
    page.getByRole("main").getByLabel("Page title", { exact: true }),
  ).toHaveValue("E2E Writing room (copy)");
  await expect(editor).toContainText("A durable idea.");
  await page.getByRole("button", { name: "Page actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Delete page" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page).toHaveURL(/\/workspace$/);
  expect(errors).toEqual([]);
});

test("tasks stay consistent across table, board drag-and-drop, calendar, and reload", async ({
  page,
}) => {
  await page.goto("/workspace/tasks");
  await page
    .locator(".page-heading")
    .getByRole("button", { name: "New task", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Task title").fill("E2E Ship Planora");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("Verify the same record in every view.");
  await dialog
    .getByRole("combobox", { name: "Priority", exact: true })
    .selectOption("URGENT");
  const now = new Date();
  const due = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;
  await dialog.getByLabel("Due date", { exact: true }).fill(due);
  await dialog.getByLabel(/^Tags/).fill("release, personal");
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(
    page.getByRole("button", { name: "E2E Ship Planora", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Priority for E2E Ship Planora").selectOption("HIGH");
  await expect(page.getByLabel("Priority for E2E Ship Planora")).toHaveValue(
    "HIGH",
  );
  await page.getByRole("tab", { name: "Board", exact: true }).click();
  const handle = page.getByRole("button", { name: "Drag E2E Ship Planora" });
  const target = page.getByRole("region", { name: "In Progress", exact: true });
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  expect(from).not.toBeNull();
  expect(to).not.toBeNull();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(from!.x + 12, from!.y + 12, { steps: 3 });
  await page.mouse.move(to!.x + to!.width / 2, to!.y + 90, { steps: 15 });
  await page.mouse.up();
  await expect(
    target.getByRole("button", { name: "Edit E2E Ship Planora" }),
  ).toBeVisible();
  await expect(
    page.getByText("Moved to In Progress", { exact: true }),
  ).toBeVisible();
  // dnd-kit briefly suppresses click events after a drop; also verify keyboard tabs.
  await page.getByRole("tab", { name: "Board", exact: true }).focus();
  await page
    .getByRole("tab", { name: "Board", exact: true })
    .press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Calendar", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("button", { name: "E2E Ship Planora", exact: true })
    .click();
  await expect(
    dialog.getByRole("combobox", { name: "Status", exact: true }),
  ).toHaveValue("IN_PROGRESS");
  await dialog
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("COMPLETED");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Mark E2E Ship Planora incomplete" }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "E2E Ship Planora", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Delete task", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "E2E Ship Planora", exact: true }),
  ).toHaveCount(0);
});

test("templates create real editable pages and global search finds content and tags", async ({
  page,
}) => {
  await page.goto("/workspace/templates");
  await page
    .getByRole("button", { name: /Weekly Planner.*Use template/ })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Page title")
    .fill("E2E Week ahead");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create page", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Page content" }),
  ).toContainText("Weekly Goals");
  await page.keyboard.press("ControlOrMeta+k");
  await page
    .getByRole("combobox", { name: "Search workspace" })
    .fill("E2E Week ahead");
  await page.getByRole("option", { name: /E2E Week ahead/ }).click();
  await expect(
    page.getByRole("main").getByLabel("Page title", { exact: true }),
  ).toHaveValue("E2E Week ahead");
  await page.keyboard.press("ControlOrMeta+k");
  await page
    .getByRole("combobox", { name: "Search workspace" })
    .fill("university");
  await expect(
    page
      .getByRole("group", { name: "Tags", exact: true })
      .getByRole("option", { name: "university" }),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "Tags", exact: true })
    .getByRole("option", { name: "university" })
    .click();
  await expect(page).toHaveURL(/tag=university/);
  await expect(
    page.getByRole("button", {
      name: "Finish analytics assignment",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Update GitHub portfolio", exact: true }),
  ).toHaveCount(0);
});

test("databases create scoped records and workspace settings persist", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Create database", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("E2E Product studio");
  await dialog
    .getByRole("button", { name: "Create database", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "E2E Product studio" }),
  ).toBeVisible();
  await page
    .locator(".page-heading")
    .getByRole("button", { name: "New task", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Task title").fill("E2E Collection task");
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(
    page.getByRole("button", { name: "E2E Collection task", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Finish analytics assignment",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.goto("/workspace/settings");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByLabel("Workspace name").fill("My creative space");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Workspace name")).toHaveValue(
    "My creative space",
  );
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("desktop and mobile routes render accessibly without console errors or viewport overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of [
    "/workspace",
    "/workspace/tasks",
    "/workspace/calendar",
    "/workspace/templates",
    "/workspace/settings",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      accessibility.violations.map((violation) => ({
        route: path,
        id: violation.id,
        failures: violation.nodes.map((node) => ({
          target: node.target,
          message: node.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/workspace",
    "/workspace/tasks",
    "/workspace/calendar",
    "/workspace/templates",
    "/workspace/settings",
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("button", { name: "Open navigation" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("dialog", { name: "Workspace navigation" }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Calendar", exact: true })
    .click();
  await expect(page).toHaveURL(/\/workspace\/calendar$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("editor retries interrupted saves and persists block order", async ({
  page,
}) => {
  await createPage(page, "E2E Resilient writing");
  const editor = page.getByRole("textbox", { name: "Page content" });
  const endpoint = "**/api/pages/*/content";
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Connection interrupted. Please retry." }),
    }),
  );
  await editor.fill("First thought");
  await expect(page.getByRole("button", { name: "Retry save" })).toBeVisible();
  await page.unroute(endpoint);
  await page.getByRole("button", { name: "Retry save" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: /^Saved$/ }),
  ).toBeVisible();
  await editor.press("End");
  await editor.press("Enter");
  await editor.pressSequentially("Second thought");
  await page
    .getByRole("button", { name: "Move block up", exact: true })
    .click();
  await expect(editor.locator("p")).toHaveText([
    "Second thought",
    "First thought",
  ]);
  await expect(
    page.getByRole("status").filter({ hasText: /^Saved$/ }),
  ).toBeVisible();
  await page.reload();
  await expect(editor.locator("p")).toHaveText([
    "Second thought",
    "First thought",
  ]);
});

test("dark appearance and editor controls meet accessibility checks", async ({
  page,
}) => {
  await page.goto("/workspace/settings");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  for (const path of [
    "/workspace",
    "/workspace/tasks",
    "/workspace/calendar",
    "/workspace/templates",
    "/workspace/settings",
  ]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveClass(/dark/);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        route: path,
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          message: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
  await createPage(page, "E2E Accessible editor");
  const editor = page.getByRole("textbox", { name: "Page content" });
  await editor.fill("An accessible thought");
  await expect(
    page.getByRole("status").filter({ hasText: /^Saved$/ }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        message: n.failureSummary,
      })),
    })),
  ).toEqual([]);
});

test("leaving a page flushes its pending draft", async ({ page }) => {
  await createPage(page, "E2E Navigation save");
  const url = page.url();
  const editor = page.getByRole("textbox", { name: "Page content" });
  await editor.fill("Save this before I leave");
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/content") &&
      response.request().method() === "PUT" &&
      response.ok(),
  );
  await page.getByRole("link", { name: "Workspace home", exact: true }).click();
  await saved;
  await page.goto(url);
  await expect(editor).toHaveText("Save this before I leave");
});

test("editor drag handles reorder blocks durably", async ({ page }) => {
  await createPage(page, "E2E Block dragging");
  const editor = page.getByRole("textbox", { name: "Page content" });
  await editor.fill("First block");
  await editor.press("End");
  await editor.press("Enter");
  await editor.pressSequentially("Second block");
  await editor.press("Enter");
  await editor.pressSequentially("Third block");
  await editor.locator("p").first().hover();
  const handle = page.getByRole("button", { name: "Drag to reorder block" });
  await expect(handle).toBeVisible();
  const last = editor.locator("p").last();
  const bounds = await last.boundingBox();
  expect(bounds).not.toBeNull();
  await handle.dragTo(last, { targetPosition: { x: 30, y: 1 } });
  await expect(editor.locator("p")).toHaveText([
    "Second block",
    "First block",
    "Third block",
  ]);
  await expect(
    page.getByRole("status").filter({ hasText: /^Saved$/ }),
  ).toBeVisible();
  await page.reload();
  await expect(editor.locator("p")).toHaveText([
    "Second block",
    "First block",
    "Third block",
  ]);
});

test("stale tabs preserve drafts instead of overwriting newer content", async ({
  page,
  context,
}) => {
  await createPage(page, "E2E Concurrent writing");
  const other = await context.newPage();
  await other.goto(page.url());
  const editor = page.getByRole("textbox", { name: "Page content" });
  const otherEditor = other.getByRole("textbox", { name: "Page content" });
  await expect(otherEditor).toBeVisible();
  await editor.fill("The latest saved version");
  await expect(
    page.getByRole("status").filter({ hasText: /^Saved$/ }),
  ).toBeVisible();
  await otherEditor.fill("A recoverable competing draft");
  await expect(
    other.getByRole("button", { name: "Reload to compare" }),
  ).toBeVisible();
  other.on("dialog", (dialog) => dialog.accept());
  await other.getByRole("button", { name: "Reload to compare" }).click();
  await expect(otherEditor).toContainText("The latest saved version");
  await other.getByRole("button", { name: "Restore draft" }).click();
  await expect(
    other.getByRole("status").filter({ hasText: /^Saved$/ }),
  ).toBeVisible();
  await other.reload();
  await expect(otherEditor).toContainText("A recoverable competing draft");
  await other.close();
});

test("a task search result can be opened again after closing it", async ({
  page,
}) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.keyboard.press("ControlOrMeta+k");
    await page
      .getByRole("combobox", { name: "Search workspace" })
      .fill("Update GitHub portfolio");
    await page
      .getByRole("option", { name: "Update GitHub portfolio", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Task title")).toHaveValue(
      "Update GitHub portfolio",
    );
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await expect(page).toHaveURL(/\/workspace\/tasks$/);
  }
});

test("reset requires confirmation and restores the demo workspace", async ({
  page,
}) => {
  await page.goto("/workspace/settings");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Reset workspace", exact: true }),
  ).toBeDisabled();
  await dialog.getByLabel("Confirmation", { exact: true }).fill("RESET");
  await dialog
    .getByRole("button", { name: "Reset workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(
    page.getByRole("link", { name: /My Workspace Personal workspace/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "E2E Product studio", exact: true }),
  ).toHaveCount(0);
  if (process.env.UPDATE_SCREENSHOTS === "1") {
    await page.goto("/workspace/settings");
    await page.getByRole("button", { name: "Light", exact: true }).click();
    await page.goto("/workspace");
    await page.screenshot({
      path: "docs/screenshots/dashboard.png",
      animations: "disabled",
    });
    await page.goto("/workspace/calendar");
    await page.screenshot({
      path: "docs/screenshots/calendar.png",
      animations: "disabled",
    });
    await page.goto("/workspace/settings");
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await page.goto("/workspace");
    await page.screenshot({
      path: "docs/screenshots/dashboard-dark.png",
      animations: "disabled",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "docs/screenshots/mobile.png",
      animations: "disabled",
    });
  }
});
