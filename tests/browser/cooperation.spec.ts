import { expect, test, type Page } from "@playwright/test";

async function coordinates(page: Page) {
  const debug = await page.getByTestId("debug-panel").textContent();
  const match = debug?.match(/PLAYER ([\d.-]+) ([\d.-]+) ([\d.-]+)/);
  if (!match) throw new Error("Missing live player position");
  return { x: Number(match[1]), y: Number(match[2]), z: Number(match[3]) };
}
async function walkUntil(page: Page, key: string, axis: "x" | "z", target: number, direction: "above" | "below") {
  await page.keyboard.down(key);
  try {
    await expect.poll(async () => {
      const value = (await coordinates(page))[axis];
      return direction === "above" ? value > target : value < target;
    }, { intervals: [50], timeout: 8_000 }).toBe(true);
  } finally { await page.keyboard.up(key); }
  await page.waitForTimeout(180);
}

test("solve the first chamber with an actual recorded past self", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/game");
  await page.getByRole("button", { name: "BEGIN EXPERIMENT" }).click();
  await page.keyboard.press("Backquote");
  await expect(page.getByTestId("debug-panel")).toContainText("GROUNDED true");
  await expect(page.getByTestId("gate-state")).toHaveText("GATE LOCKED");

  // First discover the plate, then leave it and physically hit the shut door.
  await walkUntil(page, "KeyA", "x", -3.5, "below");
  await walkUntil(page, "KeyW", "z", 2.7, "below");
  await expect(page.getByTestId("plate-a")).toContainText("YOU");
  await expect(page.getByTestId("gate-state")).toHaveText("GATE OPEN");
  await walkUntil(page, "KeyD", "x", -.5, "above");
  await expect(page.getByTestId("gate-state")).toHaveText("GATE LOCKED");
  await walkUntil(page, "KeyW", "z", -4.35, "below");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(600);
  await page.keyboard.up("KeyW");
  expect((await coordinates(page)).z).toBeGreaterThan(-4.65);
  await page.keyboard.press("KeyE");
  await expect(page.getByRole("heading", { name: "TIMELINE STABLE." })).toHaveCount(0);

  // Return to the plate and capture the exact partial run while standing still.
  await walkUntil(page, "KeyS", "z", 1.6, "above");
  await walkUntil(page, "KeyA", "x", -3.5, "below");
  await expect(page.getByTestId("plate-a")).toContainText("YOU");
  await page.keyboard.press("KeyR");
  await expect(page.getByTestId("run-number")).toContainText("RUN 02");
  await expect(page.getByTestId("echo-1")).toHaveCount(1);

  // Echo 1 repeats the exploratory path, then holds the last plate position.
  // Wait for its endpoint instead of scripting or teleporting it to the plate.
  await expect.poll(async () => {
    const debug = await page.getByTestId("debug-panel").textContent();
    const match = debug?.match(/LAST manual \/ ([\d.]+) s/);
    const now = debug?.match(/TIME ([\d.]+)/);
    return Boolean(match && now && Number(now[1]) > Number(match[1]) + .2);
  }, { timeout: 22_000 }).toBe(true);
  await expect(page.getByTestId("plate-a")).toContainText("ECHO 01");
  await expect(page.getByTestId("gate-state")).toHaveText("GATE OPEN");
  await page.screenshot({ path: "test-results/cooperation-echo.png" });

  // Pause freezes the player, the replay, and the timer together.
  await page.evaluate(() => document.exitPointerLock());
  await expect(page.getByRole("button", { name: "RESUME", exact: true })).toBeVisible();
  const timer = await page.getByTestId("timer").textContent();
  await page.waitForTimeout(400);
  expect(await page.getByTestId("timer").textContent()).toBe(timer);
  await page.getByRole("button", { name: "RESUME", exact: true }).click();

  await walkUntil(page, "KeyW", "z", -10.25, "below");
  await expect(page.getByTestId("core-prompt")).toBeVisible();
  await page.keyboard.press("KeyE");
  await expect(page.getByRole("heading", { name: "TIMELINE STABLE." })).toBeVisible();
  await expect(page.getByText("PERFECT SYNC / SOLVED IN TWO LOOPS")).toBeVisible();
  await expect(page.getByTestId("debug-panel")).toContainText("PHASE levelComplete");
  await page.screenshot({ path: "test-results/cooperation-complete.png" });
  await page.getByRole("button", { name: "BEGIN NEW TIMELINE" }).click();
  await expect(page.getByRole("button", { name: "BEGIN EXPERIMENT" })).toBeVisible();
  await expect(page.getByTestId("echo-1")).toHaveCount(0);
  await expect(page.getByTestId("archive-count")).toHaveText("0 RUNS CAPTURED");
  expect(errors).toEqual([]);
});
