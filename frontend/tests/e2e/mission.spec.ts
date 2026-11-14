import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Start your mission" }).click();
  await expect(
    page.getByRole("heading", { name: "Houston… our outpost needs a hand." }),
  ).toBeVisible();
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images).map((image) =>
        image.decode().catch(() => {}),
      ),
    ),
  );
  await page.screenshot({
    scale: "css",
    path: test.info().outputPath("briefing.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: /Pathfinder/ }).click();
  await page.getByRole("button", { name: "Accept briefing" }).click();
  await expect(
    page.getByRole("heading", { name: "Big adventure. Small backpack." }),
  ).toBeVisible();
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images).map((image) =>
        image.decode().catch(() => {}),
      ),
    ),
  );
  await page.screenshot({
    scale: "css",
    path: test.info().outputPath("equipment.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Secure loadout" }).click();
  await page.getByRole("button", { name: "Begin lunar landing" }).click();
  await expect(
    page.getByRole("button", { name: /Inspect habitat/ }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: /Inspect habitat/ }).click();
  await expect(
    page.getByText("Habitat safe. Alert: a solar-array connector has failed!", {
      exact: true,
    }),
  ).toBeVisible();
}
async function travel(page: Page, destination: string) {
  await page.getByRole("button", { name: new RegExp(destination) }).click();
  const button = page.getByRole("button", { name: "Travel to site" });
  await button.click();
  await expect(
    page.getByText("You are at this site", { exact: true }),
  ).toBeVisible();
}

test("complete mission, pause/resume, learning report, export, and replay", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await expect(
    page.getByRole("progressbar", { name: "Suit oxygen" }),
  ).toHaveAttribute("aria-valuenow", "125");
  await expect(page.locator("canvas")).toHaveCount(1);
  const map = page.getByRole("group", { name: /Lunar exploration map/ });
  await map.focus();
  await map.press("ArrowRight");
  await expect(
    page.getByRole("progressbar", { name: "Suit oxygen" }),
  ).toHaveAttribute("aria-valuenow", "124.1");
  await map.press("ArrowLeft");
  await expect(
    page.getByRole("progressbar", { name: "Suit oxygen" }),
  ).toHaveAttribute("aria-valuenow", "123.2");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole("button", { name: /Check in with Scout/ }).click();
  await expect(page.getByText(/I am keeping the base company/)).toBeVisible();
  await page.getByRole("button", { name: "Thanks, Scout!" }).click();
  await page.getByRole("button", { name: "Tell me why" }).click();
  await expect(
    page.getByText(/Every trip uses oxygen from your suit/),
  ).toBeVisible();
  await page.getByRole("button", { name: "A little less" }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Take your time, commander." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Take your time, commander." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Resume mission", exact: true })
    .click();
  await travel(page, "Solar array");
  await page.getByRole("button", { name: /Repair solar array/ }).click();
  await expect(
    page.getByText(
      "Solar array repaired. Future mission turns now generate power.",
      { exact: true },
    ),
  ).toBeVisible();
  await travel(page, "Sunlit Ridge");
  await page.getByRole("button", { name: /Collect rock sample/ }).click();
  await expect(
    page.getByText("Ancient rock sample secured!", { exact: true }),
  ).toBeVisible();
  await travel(page, "Shackleton Edge");
  await expect(
    page.getByRole("progressbar", { name: "Suit oxygen" }),
  ).not.toHaveAttribute("aria-valuenow", "125");
  // axe's focus probes can leave the skip link focused after touch interaction.
  // A screenshot captures the settled scene; keyboard focus behavior is checked separately.
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.screenshot({
    scale: "css",
    path: testInfo.outputPath("exploration.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: /Collect soil sample/ }).click();
  await expect(
    page.getByText("Shadow-soil sample secured!", { exact: true }),
  ).toBeVisible();
  await travel(page, "Artemis Base");
  await page.getByRole("button", { name: /Complete mission/ }).click();
  await expect(
    page.getByRole("heading", { name: "One extraordinary mission." }),
  ).toBeVisible();
  await page
    .locator(".celebration-stars")
    .evaluate((element) =>
      Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      ),
    );
  await page.screenshot({
    scale: "css",
    path: testInfo.outputPath("results.png"),
    fullPage: true,
  });
  const resultsAccess = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(resultsAccess.violations).toEqual([]);
  await page.getByRole("link", { name: "Open your learning report" }).click();
  await expect(
    page.getByRole("heading", { name: "Look at the choices you made." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Plan the trip home" }),
  ).toBeVisible();
  await page.screenshot({
    scale: "css",
    path: testInfo.outputPath("report.png"),
    fullPage: true,
  });
  const reportAccess = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(reportAccess.violations).toEqual([]);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export journal" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "astra-mission-journal.json",
  );
  await page.getByRole("link", { name: "Try a fresh mission" }).click();
  await expect(
    page.getByRole("link", { name: "Accept the mission" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("a depleted reserve ends the practice mission and provides a report", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: /Use battery power/ }).click();
  await travel(page, "Shackleton Edge");
  // Waiting outside uses actual simulation resources; no state injection or mocking.
  for (let i = 0; i < 20; i++) {
    if (page.url().endsWith("/results")) break;
    const button = page.getByRole("button", {
      name: "Wait 5 min",
      exact: true,
    });
    await expect(button).toBeEnabled();
    const saved = page.waitForResponse(
      (response) =>
        response.url().endsWith("/actions") &&
        response.request().method() === "POST",
    );
    await button.click();
    const nextState = await (await saved).json();
    await expect(
      page.getByText("Saving your command…", { exact: true }),
    ).toHaveCount(0);
    if (nextState.status === "FAILED") break;
  }
  await expect(
    page.getByRole("heading", { name: "Every attempt teaches you." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open your learning report" }).click();
  await expect(
    page.getByRole("heading", { name: "Look at the choices you made." }),
  ).toBeVisible();
  await expect(page.getByText("FAILED", { exact: true })).toBeVisible();
});

test("NASA attribution, deterministic ORBIT, accessibility settings and responsive layout", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.screenshot({
    scale: "css",
    path: testInfo.outputPath("landing.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  let results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole("button", { name: "Discover Artemis Base" }).click();
  await expect(
    page.getByRole("dialog", { name: "Artemis Base" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Science explorer" }).click();
  await expect(
    page.getByRole("heading", { name: "South Pole Illumination Map" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Why watch my oxygen?" }).click();
  await expect(
    page.getByText(/Every trip uses oxygen from your suit/),
  ).toBeVisible();
  await page.locator("summary").first().click();
  await expect(
    page
      .getByText("Not specified; explanatory reference", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Read the NASA source" }).first(),
  ).toHaveAttribute("href", /nasa.gov/);
  results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole("link", { name: "Settings and accessibility" }).click();
  await page.getByRole("switch", { name: /Reduce motion/ }).check();
  await page.getByRole("switch", { name: /Larger text/ }).check();
  await expect(page.locator("html")).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
  await page.reload();
  await expect(page.getByRole("switch", { name: /Larger text/ })).toBeChecked();
  results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("mission library, crew callsign, rover loadout, and safe early return", async ({
  page,
}, testInfo) => {
  await page.goto("/missions");
  await expect(page.locator(".mission-art img")).toBeVisible();
  await page.screenshot({
    scale: "css",
    path: testInfo.outputPath("mission-selection.png"),
    fullPage: true,
  });
  const selectionAccess = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(selectionAccess.violations).toEqual([]);
  await page.getByRole("link", { name: "Accept the mission" }).click();
  await expect(
    page.getByRole("heading", { name: "A crew. A callsign. A big adventure." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Voyager/ }).click();
  await page.getByRole("link", { name: "Meet your mission" }).click();
  await expect(page.getByRole("button", { name: /Voyager/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Accept briefing" }).click();
  await page.getByRole("button", { name: /Repair toolkit/ }).click();
  await page.getByRole("button", { name: /Scout the rover/ }).click();
  await expect(
    page.getByText("2 / 2 cargo slots filled", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Secure loadout" }).click();
  await page.getByRole("button", { name: "Begin lunar landing" }).click();
  await page.getByRole("button", { name: /Inspect habitat/ }).click();
  await expect(
    page.getByRole("progressbar", { name: "Battery power" }),
  ).toHaveAttribute("aria-valuenow", "138");
  await page.getByRole("button", { name: /Check in with Scout/ }).click();
  await expect(
    page.getByText(/Your rover loadout gives you 140 Wh/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Thanks, Scout!" }).click();
  const map = page.getByRole("group", { name: /Lunar exploration map/ });
  await map.focus();
  await map.press("ArrowRight");
  await expect(
    page.getByRole("progressbar", { name: "Battery power" }),
  ).toHaveAttribute("aria-valuenow", "136.5");
  await page.screenshot({
    scale: "css",
    path: testInfo.outputPath("rover.png"),
    fullPage: true,
  });
  await map.press("ArrowLeft");
  await expect(
    page.getByRole("progressbar", { name: "Battery power" }),
  ).toHaveAttribute("aria-valuenow", "135");
  await page.getByRole("button", { name: /Complete mission/ }).click();
  await expect(
    page.getByRole("heading", { name: "Your crew comes first." }),
  ).toBeVisible();
});
