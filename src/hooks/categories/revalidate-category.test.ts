import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";

import { categoryPaths, createRevalidateCategory } from "./revalidate-category";

describe("categoryPaths (spec-validation layer 4, G13)", () => {
  it("news: danh sách + trang danh mục của cả vi và en, theo đường dẫn nội bộ", () => {
    expect(categoryPaths("news", { vi: ["thi-truong"], en: ["market"] }).sort()).toEqual(
      ["/en/tin-tuc", "/en/tin-tuc/danh-muc/market", "/vi/tin-tuc", "/vi/tin-tuc/danh-muc/thi-truong"].sort(),
    );
  });

  it("nhiều slug (vừa đổi slug) → làm mới cả slug cũ lẫn mới", () => {
    const paths = categoryPaths("news", { vi: ["moi", "cu"], en: [] });
    expect(paths).toContain("/vi/tin-tuc/danh-muc/moi");
    expect(paths).toContain("/vi/tin-tuc/danh-muc/cu");
  });

  it("project: danh sách + trang danh mục dự án (BL-090) của cả vi và en", () => {
    expect(categoryPaths("project", { vi: ["x"], en: ["y"] }).sort()).toEqual(["/en/du-an", "/en/du-an/danh-muc/y", "/vi/du-an", "/vi/du-an/danh-muc/x"]);
  });

  it("scope chưa có trang danh mục (job) chỉ làm mới danh sách", () => {
    expect(categoryPaths("job", { vi: [], en: [] }).sort()).toEqual(["/en/tuyen-dung", "/vi/tuyen-dung"]);
  });

  it("rental / property_post dùng danh sách + trang danh mục của mình", () => {
    expect(categoryPaths("rental", { vi: ["can-ho"], en: [] })).toEqual(["/vi/cho-thue", "/en/cho-thue", "/vi/cho-thue/danh-muc/can-ho"]);
    expect(categoryPaths("property_post", { vi: ["tin"], en: [] })).toContain("/vi/tin-bds/danh-muc/tin");
  });
});

function fakeReq(locale: string, slugs: { vi?: string; en?: string }) {
  const findByID = vi.fn().mockResolvedValue({ slug: slugs });
  return { req: { locale, fallbackLocale: false, payload: { findByID } } as unknown as PayloadRequest, findByID };
}

describe("createRevalidateCategory", () => {
  it("afterChange: đọc slug cả hai ngôn ngữ (select slug) + slug cũ của locale đang sửa", async () => {
    const revalidate = vi.fn();
    const { afterChange } = createRevalidateCategory(revalidate);
    const { req, findByID } = fakeReq("vi", { vi: "moi", en: "market" });
    const doc = { id: "c1", scope: "news", slug: "moi" };
    await afterChange({ doc, previousDoc: { slug: "cu" }, req, operation: "update" } as never);
    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: "categories", id: "c1", locale: "all", trash: true, select: { slug: true } }));
    const paths = revalidate.mock.calls[0]![0] as string[];
    expect(paths).toEqual(
      expect.arrayContaining(["/vi/tin-tuc", "/en/tin-tuc", "/vi/tin-tuc/danh-muc/moi", "/vi/tin-tuc/danh-muc/cu", "/en/tin-tuc/danh-muc/market"]),
    );
  });

  it("afterChange: đổi tên (không đổi slug) vẫn làm mới; scope lạ thì bỏ qua", async () => {
    const revalidate = vi.fn();
    const { afterChange } = createRevalidateCategory(revalidate);
    await afterChange({ doc: { id: "c1", scope: "news" }, previousDoc: {}, req: fakeReq("vi", { vi: "a" }).req, operation: "update" } as never);
    expect(revalidate).toHaveBeenCalledTimes(1);
    await afterChange({ doc: { id: "c2", scope: "khac" }, previousDoc: {}, req: fakeReq("vi", {}).req, operation: "update" } as never);
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it("afterDelete: làm mới danh sách + slug của locale đang xoá", async () => {
    const revalidate = vi.fn();
    const { afterDelete } = createRevalidateCategory(revalidate);
    await afterDelete({ doc: { id: "c1", scope: "news", slug: "market" }, req: fakeReq("en", {}).req, id: "c1" } as never);
    expect(revalidate.mock.calls[0]![0]).toEqual(expect.arrayContaining(["/vi/tin-tuc", "/en/tin-tuc", "/en/tin-tuc/danh-muc/market"]));
  });
});
