import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";

import { NEWS_MOST_READ_TAG } from "../../lib/news/news-cache-tags";
import { createRevalidateMostRead } from "./revalidate-most-read";

const req = {} as PayloadRequest;
const published = { id: "n1", status: "published" };
const draft = { id: "n1", status: "draft" };
const trashed = { id: "n1", status: "published", deletedAt: "2026-10-22T00:00:00Z" };

type ChangeArgs = Parameters<ReturnType<typeof createRevalidateMostRead>["afterChange"]>[0];
type DeleteArgs = Parameters<ReturnType<typeof createRevalidateMostRead>["afterDelete"]>[0];

describe("createRevalidateMostRead", () => {
  it.each([
    ["xuất bản", draft, published],
    ["sửa bài đang công khai", published, published],
    ["ẩn bài", published, draft],
    ["xoá mềm", published, trashed],
  ])("%s -> làm mới tag Đọc nhiều", async (_name, previousDoc, doc) => {
    const tags = vi.fn();
    await createRevalidateMostRead(tags).afterChange({ doc, previousDoc, req } as unknown as ChangeArgs);
    expect(tags).toHaveBeenCalledExactlyOnceWith([NEWS_MOST_READ_TAG], req);
  });

  it("sửa bản nháp -> không làm mới", async () => {
    const tags = vi.fn();
    await createRevalidateMostRead(tags).afterChange({ doc: draft, previousDoc: draft, req } as unknown as ChangeArgs);
    expect(tags).not.toHaveBeenCalled();
  });

  it("xoá hẳn bài đang công khai -> làm mới; bài nháp -> không", async () => {
    const tags = vi.fn();
    const hooks = createRevalidateMostRead(tags);
    await hooks.afterDelete({ doc: draft, req } as unknown as DeleteArgs);
    expect(tags).not.toHaveBeenCalled();
    await hooks.afterDelete({ doc: published, req } as unknown as DeleteArgs);
    expect(tags).toHaveBeenCalledExactlyOnceWith([NEWS_MOST_READ_TAG], req);
  });
});
