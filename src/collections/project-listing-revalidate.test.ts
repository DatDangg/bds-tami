import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig, PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";
import { createPropertyPosts } from "./PropertyPosts";
import { createRentals } from "./Rentals";

// Chặn các hook khác của collection (đọc DB, dựng lại search text...) để chỉ quan sát đường làm mới trang chi tiết dự án.
vi.mock("../lib/search/reindex-in-hook", () => ({ reindexRentalsFromHook: vi.fn() }));

function req() {
  const find = vi.fn(async () => ({ docs: [{ id: "p1", slug: { vi: "du-an-1", en: "project-1" } }] }));
  const findByID = vi.fn(async () => ({ slug: { vi: "tin", en: "listing" } }));
  return { payload: { find, findByID, logger: { warn: vi.fn() } }, locale: "vi", context: {} } as unknown as PayloadRequest;
}

async function runChain(collection: CollectionConfig, doc: Record<string, unknown>, previousDoc: Record<string, unknown>) {
  for (const hook of collection.hooks?.afterChange ?? []) {
    try {
      await (hook as CollectionAfterChangeHook)({ doc, previousDoc, req: req(), operation: "update", collection } as unknown as Parameters<CollectionAfterChangeHook>[0]);
    } catch {
      // Hook không liên quan thiếu ngữ cảnh DB trong test: bỏ qua, chỉ cần các hook còn lại vẫn chạy.
    }
  }
}

describe("nối hook làm mới chi tiết dự án vào collection", () => {
  it("rentals: tin công khai gắn dự án đổi → làm mới trang chi tiết dự án", async () => {
    const revalidate = vi.fn();
    await runChain(createRentals(revalidate), { id: "r1", status: "published", project: "p1" }, { id: "r1", status: "published", project: "p1" });
    expect(revalidate.mock.calls.flatMap(([paths]) => paths as string[])).toEqual(expect.arrayContaining(["/vi/du-an/du-an-1", "/en/du-an/project-1"]));
  });

  it("property-posts: bài công khai có relatedProject đổi → làm mới trang chi tiết dự án; afterDelete cũng có hook", async () => {
    const revalidate = vi.fn();
    const collection = createPropertyPosts(revalidate);
    await runChain(collection, { id: "a1", status: "published", relatedProject: "p1" }, { id: "a1", status: "published", relatedProject: "p1" });
    expect(revalidate.mock.calls.flatMap(([paths]) => paths as string[])).toEqual(expect.arrayContaining(["/vi/du-an/du-an-1"]));
    revalidate.mockClear();
    for (const hook of collection.hooks?.afterDelete ?? []) {
      try {
        await (hook as CollectionAfterDeleteHook)({ doc: { id: "a1", status: "published", relatedProject: "p1" }, req: req(), collection } as unknown as Parameters<CollectionAfterDeleteHook>[0]);
      } catch {
        // như trên
      }
    }
    expect(revalidate.mock.calls.flatMap(([paths]) => paths as string[])).toEqual(expect.arrayContaining(["/vi/du-an/du-an-1"]));
  });
});
