import { expect, test, type Page } from "@playwright/test";

// BL-119: ô chọn nhiều có giới hạn (Homepage) khoá chọn thêm khi đủ và nhắc giới hạn dưới ô. Chỉ chọn rồi rời trang, không Lưu → không đổi dữ liệu dev.
const SHOTS = ".context/review-reports/assets";
const MAX = 4;

async function openRentalCategories(page: Page) {
  await page.goto("/admin/globals/homepage");
  await page.getByRole("button", { name: "Sản phẩm & Tin nổi bật" }).click();
  const field = page.locator("#field-rentals__categories");
  await field.waitFor({ state: "attached" });
  await field.evaluate((el) => (el.closest(".collapsible--collapsed")?.querySelector(".collapsible__toggle") as HTMLElement | null)?.click());
  await expect(field).toBeVisible();
  return field;
}

test("Cho thuê · Danh mục: đủ 4 thì hết mục chọn thêm và có nhắc 'Tối đa 4 danh mục.'", async ({ page }) => {
  const field = await openRentalCategories(page);
  while ((await field.locator(".rs__multi-value__remove").count()) > 0) await field.locator(".rs__multi-value__remove").first().click();
  const options = page.locator(".rs__menu .rs__option:not(.rs__option--is-disabled)");

  for (let picked = 0; picked < MAX; picked++) {
    await expect(field.locator(".tami-max-hint")).toHaveCount(0);
    await field.locator(".rs__control").click();
    await expect(options.first()).toBeVisible({ timeout: 10_000 });
    await options.first().click();
    await expect(field.locator(".rs__multi-value")).toHaveCount(picked + 1);
  }

  await expect(field.locator(".tami-max-hint")).toHaveText(`Tối đa ${MAX} danh mục.`);
  await field.locator(".rs__control").click();
  // Menu mở lại nhưng không còn mục nào để chọn thêm (filterOptions chỉ còn đúng 4 mục đã chọn).
  await page.waitForTimeout(1000);
  await expect(options).toHaveCount(0);
  await expect(field.locator(".rs__multi-value")).toHaveCount(MAX);
  await field.screenshot({ path: `${SHOTS}/bl119-after-select.png` });
  await page.keyboard.press("Escape");

  // Quy tắc CSS chỉ áp cho đúng ô có hint: ô relationship khác cùng tab giữ nút "+ Thêm mới" và viền mặc định.
  const otherField = page.locator("#field-featuredOffers__posts");
  await otherField.waitFor({ state: "attached" });
  await otherField.evaluate((el) => (el.closest(".collapsible--collapsed")?.querySelector(".collapsible__toggle") as HTMLElement | null)?.click());
  await expect(otherField).toBeVisible();
  await expect(otherField.locator(".relationship-add-new")).toBeVisible();
  await expect(field.locator(".relationship-add-new")).toBeHidden();
  await field.screenshot({ path: `${SHOTS}/bl119-after-select-hint.png` });
  const borderOf = (target: typeof field) => target.locator(".rs__control").evaluate((el) => getComputedStyle(el).borderColor);
  const danger = await page.evaluate(() => {
    const probe = document.createElement("i");
    probe.style.color = "var(--admin-badge-danger-fg)";
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  expect(await borderOf(otherField)).not.toBe(danger);

  // Bỏ 1 mục → hint biến mất và menu lại có mục để chọn (form-state cập nhật sau debounce).
  await field.locator(".rs__multi-value__remove").first().click();
  await expect(field.locator(".tami-max-hint")).toHaveCount(0, { timeout: 10_000 });
  await field.locator(".rs__control").click();
  await expect(options.first()).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");
  // Hết đủ giới hạn → nút "+ Thêm mới" hiện lại.
  await expect(field.locator(".relationship-add-new")).toBeVisible();
});
