import { beforeEach, describe, expect, it, vi } from "vitest";

const RentalListPage = vi.hoisted(() => vi.fn(async () => null));
const buildRentalListMetadata = vi.hoisted(() => vi.fn(async () => ({ title: "x" })));
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("@/components/rentals/RentalListPage", () => ({ RentalListPage, buildRentalListMetadata }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next-intl/server", () => ({ setRequestLocale: () => undefined }));

import RentalCategoryPage, { dynamic, generateMetadata } from "./page";

const props = (locale: string, category: string, searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ locale, category }),
  searchParams: Promise.resolve(searchParams),
});

beforeEach(() => {
  RentalListPage.mockClear();
  buildRentalListMetadata.mockClear();
  notFound.mockClear();
});

describe("route /cho-thue/danh-muc/[category]", () => {
  it("render theo request (đọc searchParams), truyền slug danh mục khoá cho RentalListPage", async () => {
    expect(dynamic).toBe("force-dynamic");
    const element = await RentalCategoryPage(props("vi", "can-ho", { province: "ha-noi" }));
    expect(element.props).toEqual({ locale: "vi", searchParams: { province: "ha-noi" }, categorySlug: "can-ho" });
  });

  it("generateMetadata truyền slug + ngôn ngữ; ngôn ngữ lạ → metadata rỗng / notFound", async () => {
    await generateMetadata(props("en", "apartment"));
    expect(buildRentalListMetadata).toHaveBeenCalledWith({ locale: "en", searchParams: {}, categorySlug: "apartment" });
    expect(await generateMetadata(props("fr", "x"))).toEqual({});
    await expect(RentalCategoryPage(props("fr", "x"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
