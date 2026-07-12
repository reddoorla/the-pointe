import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

test("converted the-pointe — full page + segments", async ({ page }) => {
  mkdirSync("/tmp/pointe-shots", { recursive: true });
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/dev/blux-page", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: "/tmp/pointe-shots/converted-full.png",
    fullPage: true,
  });
  const sections = page.locator("[data-slice-type]");
  const n = await sections.count();
  for (let i = 0; i < n; i++) {
    await sections
      .nth(i)
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await sections
      .nth(i)
      .screenshot({
        path: `/tmp/pointe-shots/band-${String(i).padStart(2, "0")}.png`,
      })
      .catch(() => {});
  }
  console.log(
    "SECTIONS:",
    n,
    "CONSOLE_ERRORS:",
    errors.length,
    errors.slice(0, 5).join(" | "),
  );
});
