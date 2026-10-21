import type { Field } from "payload";
import { describe, expect, it } from "vitest";

import { flattenLayoutFields } from "../lib/admin/form-layout";
import { Leads } from "./Leads";

type AnyField = Field & { name?: string; admin?: Record<string, unknown>; access?: Record<string, unknown>; fields?: Field[]; label?: string };

const tabs = (Leads.fields.find((f) => f.type === "tabs") as { tabs: { label: string; fields: AnyField[] }[] }).tabs;
const tab = (label: string) => tabs.find((t) => t.label === label)!;
const all = (): AnyField[] => flattenLayoutFields(Leads.fields) as AnyField[];
const byName = (name: string) => all().find((f) => f.name === name)!;
const FIELD = (name: string) => (byName(name).admin?.components as { Field?: string } | undefined)?.Field;

describe("Leads form (BL-042 #11)", () => {
  it("UTM + Trang gửi/đến nằm trong khối thu gọn mặc định đóng", () => {
    const box = tab("Nguồn").fields.find((f) => f.type === "collapsible") as AnyField;
    expect(box.label).toBe("Dữ liệu chiến dịch marketing");
    expect(box.admin?.initCollapsed).toBe(true);
    expect((box.fields as AnyField[]).map((f) => f.name)).toEqual(["utm", "pageUrl", "referrer"]);
    expect(FIELD("pageUrl")).toContain("LeadLinkField");
    expect(FIELD("referrer")).toContain("LeadLinkField");
  });

  it("consent ở cuối tab Nguồn, không còn ở tab Khách hàng", () => {
    const last = tab("Nguồn").fields.at(-1) as AnyField;
    expect(last.type).toBe("row");
    expect((last.fields as AnyField[]).map((f) => f.name)).toEqual(["consentAt", "consentVersion"]);
    expect(flattenLayoutFields(tab("Khách hàng").fields).map((f) => (f as AnyField).name)).not.toContain("consentAt");
  });

  it("4 mốc + anonymizedAt không hiện ở form nhưng KHÔNG dùng admin.hidden (giữ cột/lọc danh sách)", () => {
    for (const name of ["firstContactedAt", "lastActivityAt", "mergedCount", "remindedAt", "anonymizedAt"]) {
      expect(FIELD(name)).toContain("LeadHiddenField");
      expect(byName(name).admin?.hidden).toBeUndefined();
    }
    expect(byName("lastActivityAt").admin?.disableListColumn).toBeUndefined();
    expect(byName("firstContactedAt").admin?.disableListColumn).toBeUndefined();
    expect(FIELD("activitySummary")).toContain("LeadActivitySummary");
    expect(byName("assignedAt").admin?.components).toBeUndefined();
  });

  it("nút liên hệ chỉ gắn afterInput cho phone/email; locale là nhãn chỉ đọc", () => {
    const after = (n: string) => (byName(n).admin?.components as { afterInput?: string[] }).afterInput?.[0];
    expect(after("phone")).toContain("LeadPhoneActions");
    expect(after("email")).toContain("LeadEmailAction");
    expect(FIELD("locale")).toContain("LeadLocaleField");
    expect(byName("locale")).toMatchObject({ required: true, access: { update: expect.any(Function) } });
  });

  it("access trường nhạy cảm không đổi (BR-32)", () => {
    expect(byName("ipHash").access).toMatchObject({ read: expect.any(Function), create: expect.any(Function), update: expect.any(Function) });
    expect(byName("userAgent").admin?.hidden).toBe(true);
    expect(byName("ipHash").admin?.hidden).toBe(true);
    expect(byName("phone").access).toEqual({ update: expect.any(Function) });
    expect(byName("email").access).toEqual({ update: expect.any(Function) });
    expect(Object.keys(byName("lastActivityAt").access ?? {})).toEqual(["create", "update"]);
  });
});
