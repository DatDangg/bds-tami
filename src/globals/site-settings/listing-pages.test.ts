import type { ArrayField, CheckboxField, Field, GroupField, TextField } from "payload";
import { describe, expect, it } from "vitest";

import { TRANSLATABLE_FIELDS } from "../../lib/translation/leaves";
import { createSiteSettings } from "../SiteSettings";
import { LISTING_PAGE_KEYS, listingPagesField, MAX_LISTING_FAQS, MAX_QUICK_SEARCH } from "./listing-pages";

const named = <T extends Field>(fields: readonly Field[], name: string) => fields.find((field) => "name" in field && field.name === name) as T;
const group = (key: string) => named<GroupField>(listingPagesField.fields, key);
const runValidate = (field: TextField, value: unknown) => (field.validate as (v: unknown, o: unknown) => unknown)(value, {});

describe("site-settings: tab \"Trang danh sách\" (BL-052)", () => {
  it("nằm trong tab riêng của site-settings", () => {
    const tabs = createSiteSettings().fields.find((field) => field.type === "tabs");
    const tab = tabs && "tabs" in tabs ? tabs.tabs.find((item) => item.label === "Trang danh sách") : undefined;
    expect(tab?.fields).toContain(listingPagesField);
    expect((listingPagesField as { name?: string }).name).toBe("listingPages");
  });

  it("3 nhóm projects / rentals / propertyPosts, mỗi nhóm quickSearch + learnMore + faqs", () => {
    expect(LISTING_PAGE_KEYS).toEqual(["projects", "rentals", "propertyPosts"]);
    for (const key of LISTING_PAGE_KEYS) {
      const page = group(key);
      const quickSearch = named<ArrayField>(page.fields, "quickSearch");
      expect(quickSearch.maxRows).toBe(MAX_QUICK_SEARCH);
      expect(named<TextField>(quickSearch.fields, "label")).toMatchObject({ localized: true, required: true });
      const faqs = named<ArrayField>(page.fields, "faqs");
      expect(faqs.maxRows).toBe(MAX_LISTING_FAQS);
      for (const name of ["question", "answer"]) expect(named<TextField>(faqs.fields, name)).toMatchObject({ localized: true, required: true });
      const learnMore = named<GroupField>(page.fields, "learnMore");
      for (const name of ["eyebrow", "title", "titleAccent", "description", "ctaLabel"]) expect(named<TextField>(learnMore.fields, name).localized).toBe(true);
      for (const name of ["image", "videoUrl", "ctaHref"]) expect((named<TextField>(learnMore.fields, name) as { localized?: boolean }).localized).toBeFalsy();
    }
    expect(MAX_QUICK_SEARCH).toBe(8);
    expect(MAX_LISTING_FAQS).toBe(10);
  });

  it("showStrengths chỉ ở Cho thuê / Tin BĐS, mặc định bật (Dự án dùng showProjectStrengths sẵn có)", () => {
    expect(named<CheckboxField>(group("projects").fields, "showStrengths")).toBeUndefined();
    for (const key of ["rentals", "propertyPosts"]) expect(named<CheckboxField>(group(key).fields, "showStrengths").defaultValue).toBe(true);
  });

  it("ctaHref nhận đường dẫn nội bộ / https, chặn đích khác; videoUrl như tin cho thuê", () => {
    const learnMore = named<GroupField>(group("rentals").fields, "learnMore");
    const ctaHref = named<TextField>(learnMore.fields, "ctaHref");
    expect(runValidate(ctaHref, "")).toBe(true);
    expect(runValidate(ctaHref, "/lien-he")).toBe(true);
    expect(runValidate(ctaHref, "https://example.test")).toBe(true);
    for (const bad of ["javascript:alert(1)", "//evil.example", "http://example.test", "lien-he"]) expect(runValidate(ctaHref, bad)).not.toBe(true);
    const videoUrl = named<TextField>(learnMore.fields, "videoUrl");
    expect(runValidate(videoUrl, "https://www.tiktok.com/@a/video/1")).toBe(true);
    expect(runValidate(videoUrl, "https://evil.example/v")).not.toBe(true);
  });

  it("chữ của listingPages được dịch tự động", () => {
    expect(TRANSLATABLE_FIELDS["site-settings"]).toContain("listingPages");
  });
});
