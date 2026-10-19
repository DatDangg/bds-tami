import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";
import { createRevalidateProjectOnListing } from "./revalidate-project-on-listing";

const projects: Record<string, { id: string; slug: { vi: string; en?: string } }> = {
  p1: { id: "p1", slug: { vi: "du-an-1", en: "project-1" } },
  p2: { id: "p2", slug: { vi: "du-an-2" } },
};

function setup(field: "project" | "relatedProject" = "project", publicStatuses: readonly string[] = ["published", "rented"]) {
  const revalidated: string[][] = [];
  const find = vi.fn(async (args: { where: { id: { in: string[] } } }) => ({ docs: args.where.id.in.flatMap((id) => projects[id] ?? []) }));
  const req = { payload: { find } } as unknown as PayloadRequest;
  const hooks = createRevalidateProjectOnListing({ field, publicStatuses, revalidate: (paths) => void revalidated.push(paths) });
  const change = (doc: Record<string, unknown>, previousDoc?: Record<string, unknown>) =>
    hooks.afterChange({ doc, previousDoc, req } as Parameters<CollectionAfterChangeHook>[0]);
  const remove = (doc: Record<string, unknown>) => hooks.afterDelete({ doc, req } as Parameters<CollectionAfterDeleteHook>[0]);
  return { revalidated, find, change, remove };
}

describe("createRevalidateProjectOnListing (Tin liên quan của chi tiết dự án)", () => {
  it("xuất bản tin thuộc dự án → làm mới trang chi tiết dự án (vi + en), chỉ đúng trang đó", async () => {
    const { revalidated, change } = setup();
    await change({ id: "r1", status: "published", project: "p1" }, { id: "r1", status: "draft", project: "p1" });
    expect(revalidated.flat().sort()).toEqual(["/en/du-an/project-1", "/vi/du-an/du-an-1"]);
  });

  it("đổi dự án của tin công khai → làm mới CẢ dự án cũ lẫn mới (kể cả khi quan hệ đã populate)", async () => {
    const { revalidated, change } = setup();
    await change({ id: "r1", status: "published", project: { id: "p2" } }, { id: "r1", status: "published", project: "p1" });
    expect(revalidated.flat().sort()).toEqual(["/en/du-an/project-1", "/vi/du-an/du-an-1", "/vi/du-an/du-an-2"]);
  });

  it("sửa tin đang công khai, ẩn tin, xoá mềm → làm mới; xoá hẳn tin công khai → làm mới", async () => {
    const { revalidated, change, remove } = setup();
    await change({ id: "r1", status: "published", project: "p1", title: "mới" }, { id: "r1", status: "published", project: "p1" });
    await change({ id: "r1", status: "hidden", project: "p1" }, { id: "r1", status: "published", project: "p1" });
    await change({ id: "r1", status: "published", project: "p1", deletedAt: "2026-10-20" }, { id: "r1", status: "published", project: "p1" });
    await remove({ id: "r1", status: "published", project: "p1" });
    expect(revalidated).toHaveLength(4);
  });

  it("tin property-posts dùng relatedProject và chỉ trạng thái published", async () => {
    const { revalidated, change } = setup("relatedProject", ["published"]);
    await change({ id: "a1", status: "published", relatedProject: "p2" }, { id: "a1", status: "draft" });
    expect(revalidated.flat()).toEqual(["/vi/du-an/du-an-2"]);
    await change({ id: "a1", status: "rented", relatedProject: "p2" }, { id: "a1", status: "draft", relatedProject: "p2" });
    expect(revalidated).toHaveLength(1);
  });

  it("nháp sửa tiếp / xoá bản nháp / tin không gắn dự án / dự án đã xoá hẳn → không làm mới", async () => {
    const { revalidated, find, change, remove } = setup();
    await change({ id: "r1", status: "draft", project: "p1" }, { id: "r1", status: "draft", project: "p1" });
    await remove({ id: "r1", status: "draft", project: "p1" });
    await change({ id: "r1", status: "published" }, { id: "r1", status: "draft" });
    expect(find).not.toHaveBeenCalled();
    await change({ id: "r1", status: "published", project: "p-da-xoa" }, { id: "r1", status: "draft" });
    expect(revalidated).toHaveLength(0);
  });

  it("không đụng danh sách hay trang chủ: chỉ đường dẫn chi tiết dự án", async () => {
    const { revalidated, change } = setup();
    await change({ id: "r1", status: "published", project: "p1", isFeatured: true }, { id: "r1", status: "draft" });
    expect(revalidated.flat().every((path) => /^\/(vi|en)\/du-an\/[^/]+$/.test(path))).toBe(true);
  });
});
