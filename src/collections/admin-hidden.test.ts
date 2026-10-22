import { describe, expect, it } from "vitest";

import { LeadActivities } from "./LeadActivities";
import { NewsletterSubscribers } from "./NewsletterSubscribers";
import { NewsViewsDaily } from "./NewsViewsDaily";
import { PrivateFiles } from "./PrivateFiles";

describe("collection ẩn khỏi menu admin (BL-041)", () => {
  it("lead-activities và private-files có admin.hidden === true (không phụ thuộc user)", () => {
    expect(LeadActivities.admin?.hidden).toBe(true);
    expect(PrivateFiles.admin?.hidden).toBe(true);
  });
});

describe("collection BL-054 chỉ admin thấy trong menu", () => {
  it.each([
    ["news-views-daily", NewsViewsDaily],
    ["newsletter-subscribers", NewsletterSubscribers],
  ] as const)("%s: ẩn với sale / chưa đăng nhập, hiện với admin", (_slug, collection) => {
    const hidden = collection.admin?.hidden as (args: { user: unknown }) => boolean;
    expect(hidden({ user: { role: "sale" } })).toBe(true);
    expect(hidden({ user: null })).toBe(true);
    expect(hidden({ user: { role: "admin" } })).toBe(false);
  });
});
