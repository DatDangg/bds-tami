import type { Field, JoinField } from "payload";
import { describe, expect, it } from "vitest";

import { LeadActivities } from "../../src/collections/LeadActivities";
import { Leads } from "../../src/collections/Leads";

function flattenFields(fields: Field[]): Field[] {
  return fields.flatMap((field): Field[] => {
    if (field.type === "tabs") return flattenFields(field.tabs.flatMap((tab) => tab.fields));
    if (field.type === "row" || field.type === "collapsible" || field.type === "group") return [field, ...flattenFields(field.fields)];
    return [field];
  });
}

/** BL-078: bảng "Lịch sử chăm sóc" trong form lead phải cho thấy trạng thái trước → sau của dòng "Đổi trạng thái". */
describe("Leads join activities — cột bảng lịch sử", () => {
  const activities = flattenFields(Leads.fields).find((field): field is JoinField => field.type === "join" && field.name === "activities");

  it("khai admin.defaultColumns có fromStatus + toStatus, không có cột lead", () => {
    expect(activities).toBeDefined();
    const columns = activities?.admin?.defaultColumns;
    expect(columns).toEqual(expect.arrayContaining(["type", "fromStatus", "toStatus", "actor", "createdAt"]));
    expect(columns).not.toContain("lead");
  });

  it("mọi cột khai báo là field có thật của lead-activities (gõ sai tên thì Payload lặng lẽ bỏ cột)", () => {
    const names = new Set(["createdAt", "updatedAt", ...flattenFields(LeadActivities.fields).flatMap((field) => ("name" in field ? [field.name] : []))]);
    for (const column of activities?.admin?.defaultColumns ?? []) expect(names, column).toContain(column);
  });
});
