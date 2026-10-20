import type { BasePayload } from "payload";
import { describe, expect, it, vi } from "vitest";

vi.mock("@payloadcms/ui", () => ({
  useListQuery: () => ({ query: {}, refineListData: vi.fn() }),
  useListDrawerContext: () => ({ isInDrawer: false }),
}));

import { JobApplications } from "../../collections/JobApplications";
import { createJobPostings } from "../../collections/JobPostings";
import { createNews } from "../../collections/News";
import { createProjects } from "../../collections/Projects";
import { createPropertyPosts } from "../../collections/PropertyPosts";
import { CollectionQuickFilterSlot } from "./CollectionQuickFilterSlot";
import { QuickFilterChips } from "./QuickFilterChips";

const SLOT = "/components/admin/CollectionQuickFilterSlot#CollectionQuickFilterSlot";
const payload = { find: vi.fn().mockResolvedValue({ docs: [] }) } as unknown as BasePayload;

describe("CollectionQuickFilterSlot", () => {
  it("thùng rác → null", async () => {
    const element = await CollectionQuickFilterSlot({ collectionSlug: "projects", payload, params: { segments: ["collections", "projects", "trash"] } });
    expect(element).toBeNull();
  });

  it("danh sách thường → QuickFilterChips; collection không có nhóm → null", async () => {
    const element = await CollectionQuickFilterSlot({ collectionSlug: "projects", payload, params: { segments: ["collections", "projects"] } });
    expect(element?.type).toBe(QuickFilterChips);
    expect(await CollectionQuickFilterSlot({ collectionSlug: "leads", payload })).toBeNull();
  });
});

describe("đăng ký slot ở collection", () => {
  it("5 collection có slot chip đứng TRƯỚC ô Trạng thái dịch (nếu có)", () => {
    for (const collection of [createProjects(), createNews(), createPropertyPosts(), createJobPostings(), JobApplications]) {
      const slots = collection.admin?.components?.beforeListTable as string[];
      expect(slots[0], collection.slug).toBe(SLOT);
      const translationIndex = slots.findIndex((slot) => slot.includes("TranslationStatusFilter"));
      if (translationIndex >= 0) expect(translationIndex).toBeGreaterThan(0);
    }
  });
});
