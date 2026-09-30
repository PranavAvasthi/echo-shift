import { expect, test, type Page } from "@playwright/test";

async function position(page: Page) {
  const text = await page.getByTestId("debug-panel").textContent();
  const matches = text?.match(/PLAYER ([\d.-]+) ([\d.-]+) ([\d.-]+)/);
  if (!matches) throw new Error("Player debug telemetry is unavailable");
  return { x: Number(matches[1]), y: Number(matches[2]), z: Number(matches[3]) };
}

test("actual WebGL room: movement, jumping, collision, pause and manual reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/game");
  await expect(page.getByRole("button", { name: "BEGIN CALIBRATION" })).toBeVisible();
  await page.keyboard.press("Backquote");
  await page.getByRole("button", { name: "BEGIN CALIBRATION" }).click();
  await expect(page.getByRole("button", { name: "BEGIN CALIBRATION" })).not.toBeVisible();
  await expect(page.getByTestId("debug-panel")).toContainText("GROUNDED true");
  const initial = await position(page);
  expect(initial.y).toBeGreaterThan(.7);
  expect(initial.y).toBeLessThan(.9);

  await page.keyboard.press("Space");
  await expect.poll(async () => (await position(page)).y).toBeGreaterThan(1.2);
  await expect(page.getByTestId("debug-panel")).toContainText("GROUNDED true");
  await page.keyboard.down("KeyW");
  await expect.poll(async () => (await position(page)).z).toBeLessThan(3);
  await page.keyboard.up("KeyW");
  await expect.poll(async () => (await position(page)).z).toBeLessThan(3);
  await page.keyboard.down("KeyD");
  await expect.poll(async () => (await position(page)).x).toBeGreaterThan(7);
  await page.keyboard.up("KeyD");
  const againstWall = await position(page);
  expect(againstWall.x).toBeGreaterThan(7);
  expect(againstWall.x).toBeLessThan(8.6);

  await page.evaluate(() => document.exitPointerLock());
  await expect(page.getByRole("button", { name: "RESUME", exact: true })).toBeVisible();
  await page.waitForTimeout(400);
  const time = await page.getByTestId("timer").textContent();
  const stopped = await position(page);
  await page.waitForTimeout(600);
  expect(await page.getByTestId("timer").textContent()).toBe(time);
  expect(await position(page)).toEqual(stopped);
  await page.getByRole("button", { name: "RESUME", exact: true }).click();
  await page.keyboard.press("KeyR");
  await expect(page.getByTestId("run-number")).toContainText("RUN 02");
  await expect.poll(async () => (await position(page)).x).toBeCloseTo(0, 1);
  await expect.poll(async () => (await position(page)).z).toBeCloseTo(6, 1);
  await page.screenshot({ path: "test-results/foundation-chamber.png" });
  expect(errors).toEqual([]);
});

test("mobile gets a desktop notice without starting WebGL", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/game");
  await expect(page.getByRole("heading", { name: "OPEN ON DESKTOP" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});
