import type { Field } from "payload";
import { describe, expect, it } from "vitest";

import { fillImageAlt } from "../hooks/media/default-alt";
import { createSiteSettings } from "../globals/SiteSettings";
import { findLayoutField } from "../lib/admin/form-layout";
import { ADMIN_COLLECTIONS } from "./admin-collections";
import { Media } from "./Media";

type Admin = { admin?: { components?: Record<string, unknown>; description?: string; placeholder?: string; readOnly?: boolean } };
const collection = (slug: string) => {
  const found = ADMIN_COLLECTIONS.find((candidate) => candidate.slug === slug);
  if (!found) throw new Error(`thiếu collection ${slug}`);
  return found;
};
const settingsField = (name: string) => findLayoutField(createSiteSettings().fields as Field[], name) as (Field & Admin) | undefined;

const glossaryField = (name: string) => findLayoutField((settingsField("translationGlossary") as unknown as { fields: Field[] }).fields, name) as (Field & Admin) | undefined;

describe("form dễ dùng (BL-042 T04)", () => {
  it("Cho thuê: mã tin to đầu form (ui, trước tab), field code vẫn là dữ liệu + cột + tìm kiếm", () => {
    const rentals = collection("rentals");
    const names = rentals.fields.map((field) => ("name" in field ? field.name : undefined));
    expect(names.indexOf("codeBanner")).toBeGreaterThan(-1);
    expect(names.indexOf("codeBanner")).toBeLessThan(names.findIndex((name) => name === undefined));
    expect(rentals.fields.find((field) => "name" in field && field.name === "codeBanner")).toMatchObject({ type: "ui" });
    expect(findLayoutField(rentals.fields, "code")).toMatchObject({ type: "text", required: true, unique: true });
    expect(rentals.admin?.defaultColumns).toContain("code");
    expect(rentals.admin?.listSearchableFields).toContain("code");
  });

  it("Tuyển dụng: deadline có badge quá hạn ở form + Cell danh sách; cột mặc định giữ", () => {
    const jobs = collection("job-postings");
    const deadline = findLayoutField(jobs.fields, "deadline") as Field & Admin;
    expect(deadline.admin?.components?.afterInput).toEqual(["/components/admin/JobDeadlineDisplay#JobDeadlineNotice"]);
    expect(deadline.admin?.components?.Cell).toBe("/components/admin/JobDeadlineDisplay#JobDeadlineCell");
    expect(jobs.admin?.defaultColumns).toContain("deadline");
  });

  it("Cấu hình chung: phiên bản chính sách là nhãn nhỏ; GA có chỉ dẫn; thuật ngữ có ví dụ", () => {
    const privacy = settingsField("privacyPolicyVersion");
    expect(privacy?.admin?.components?.Field).toBe("/components/admin/SiteSettingsDisplay#PrivacyPolicyVersionField");
    expect(privacy?.admin?.readOnly).toBe(true);
    expect((privacy as { access?: { update?: unknown } }).access?.update).toBeDefined();
    expect(settingsField("gaMeasurementId")?.admin).toMatchObject({ placeholder: "G-XXXXXXXXXX" });
    expect(settingsField("gaMeasurementId")?.admin?.description).toContain("Luồng dữ liệu");
    expect(settingsField("translationGlossary")?.admin?.description).toContain("Serviced Apartment");
    expect(glossaryField("vi")?.admin?.placeholder).toContain("Căn hộ dịch vụ");
    expect(glossaryField("en")?.admin?.placeholder).toContain("Serviced Apartment");
  });

  it("Media: hook điền alt gắn ở beforeValidate; validator alt giữ làm lưới an toàn", () => {
    expect(Media.hooks?.beforeValidate).toContain(fillImageAlt);
    const alt = findLayoutField(Media.fields, "alt") as { validate?: (value: unknown, options: unknown) => unknown };
    expect(alt.validate?.("", { siblingData: { mimeType: "image/png" } })).toBe("Ảnh cần mô tả (alt).");
    expect(alt.validate?.("", { siblingData: { mimeType: "application/pdf" } })).toBe(true);
  });
});
