import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";
import { describe, expect, it } from "vitest";
import { createRevalidateHomepageOnUnpublish } from "./revalidate-homepage-on-service";

const req = {} as PayloadRequest;

function setup() {
  const tags: string[][] = [];
  const paths: string[][] = [];
  const hooks = createRevalidateHomepageOnUnpublish({ tags: (value) => void tags.push(value), paths: (value) => void paths.push(value) });
  const change = (doc: Record<string, unknown>, previousDoc?: Record<string, unknown>) =>
    hooks.afterChange({ doc, previousDoc, req } as Parameters<CollectionAfterChangeHook>[0]);
  const remove = (doc: Record<string, unknown>) => hooks.afterDelete({ doc, req } as Parameters<CollectionAfterDeleteHook>[0]);
  return { tags, paths, change, remove };
}

describe("createRevalidateHomepageOnUnpublish (dự án/ưu đãi chọn tay hiện ở trang chủ)", () => {
  it("ẩn một bản ghi đang công khai → làm mới tag global:homepage và /vi /en", async () => {
    const { tags, paths, change } = setup();
    await change({ id: "p1", status: "hidden" }, { id: "p1", status: "published" });
    expect(tags.flat()).toContain("global:homepage");
    expect(paths.flat()).toEqual(expect.arrayContaining(["/vi", "/en"]));
  });

  it("xoá mềm bản ghi đang công khai → làm mới", async () => {
    const { tags, change } = setup();
    await change({ id: "p1", status: "published", deletedAt: "2026-10-18T00:00:00.000Z" }, { id: "p1", status: "published" });
    expect(tags.flat()).toContain("global:homepage");
  });

  it("xoá hẳn bản ghi đang công khai → làm mới", async () => {
    const { tags, remove } = setup();
    await remove({ id: "p2", status: "published" });
    expect(tags.flat()).toContain("global:homepage");
  });

  it("xuất bản bản ghi mới hoặc sửa bản đang công khai (vẫn công khai) → không làm mới", async () => {
    const { tags, paths, change } = setup();
    await change({ id: "p1", status: "published" }, { id: "p1", status: "draft" });
    await change({ id: "p1", status: "published", title: "Mới" }, { id: "p1", status: "published" });
    expect(tags).toHaveLength(0);
    expect(paths).toHaveLength(0);
  });

  it("bản nháp sửa tiếp / xoá bản nháp → không làm mới", async () => {
    const { tags, paths, change, remove } = setup();
    await change({ id: "p1", status: "draft" }, { id: "p1", status: "draft" });
    await remove({ id: "p2", status: "draft" });
    expect(tags).toHaveLength(0);
    expect(paths).toHaveLength(0);
  });
});
