import { test, expect } from "@playwright/test";
test("public demo supports pages, editor persistence, search, and visitor isolation", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/workspace");
  await expect(page.getByRole("note")).toContainText(
    "Your changes stay in this browser",
  );
  await page.getByRole("button", { name: "Quick create page" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Page title")
    .fill("Visitor private draft");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create page", exact: true })
    .click();
  const editor = page.getByRole("textbox", { name: "Page content" });
  await editor.fill("Only in my browser");
  await expect(
    page.getByRole("status").filter({ hasText: /^Saved$/ }),
  ).toBeVisible();
  await page.reload();
  await expect(editor).toContainText("Only in my browser");
  await page.keyboard.press("ControlOrMeta+k");
  await page
    .getByRole("combobox", { name: "Search workspace" })
    .fill("Only in my browser");
  await expect(
    page.getByRole("option", { name: /Visitor private draft/ }),
  ).toBeVisible();
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto("http://127.0.0.1:3200/workspace");
  await expect(
    otherPage.getByRole("link", { name: /Visitor private draft/ }),
  ).toHaveCount(0);
  await other.close();
  expect(errors).toEqual([]);
});
test("public demo tasks persist across views and reset only the browser demo", async ({
  page,
}) => {
  await page.goto("/workspace/tasks");
  await page
    .locator(".page-heading")
    .getByRole("button", { name: "New task" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Task title").fill("Demo release");
  await dialog.getByLabel("Due date").fill("2026-09-15");
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(
    page.getByRole("button", { name: "Demo release", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Status for Demo release").selectOption("COMPLETED");
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Mark Demo release incomplete" }),
  ).toBeChecked();
  await page.getByRole("tab", { name: "Board", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Completed", exact: true })
      .getByRole("button", { name: "Edit Demo release" }),
  ).toBeVisible();
  await page.goto("/workspace/settings");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await dialog.getByLabel("Confirmation").fill("RESET");
  await dialog
    .getByRole("button", { name: "Reset workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.goto("/workspace/tasks");
  await expect(
    page.getByRole("button", { name: "Demo release", exact: true }),
  ).toHaveCount(0);
});
