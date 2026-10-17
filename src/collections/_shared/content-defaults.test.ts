import type { CollectionConfig, Field } from "payload";
import { describe, expect, it } from "vitest";

import { isAdmin } from "../../access";
import { withContentDefaults } from "./content-defaults";

const base: CollectionConfig = { slug: "news", fields: [{ name: "title", type: "text", localized: true }] };
const find = (config: CollectionConfig, name: string) =>
  config.fields.find((field: Field) => "name" in field && field.name === name) as { access?: Record<string, unknown> };

describe("withContentDefaults: fieldAccess", () => {
  it("mặc định hasEnglish không ai sửa được (access deny-all)", () => {
    const access = find(withContentDefaults(base), "hasEnglish").access;
    expect(access?.update).toBeTypeOf("function");
    expect((access?.update as () => boolean)()).toBe(false);
  });

  it("collection ghi đè access của trường dùng chung theo tên, giữ phần không ghi đè", () => {
    const config = withContentDefaults(base, { fieldAccess: { hasEnglish: { update: isAdmin } } });
    const access = find(config, "hasEnglish").access;
    expect(access?.update).toBe(isAdmin);
    expect((access?.create as () => boolean)()).toBe(false);
  });

  it("collection ghi đè access cấp collection (create) qua collection.access", () => {
    const config = withContentDefaults({ ...base, access: { create: isAdmin } });
    expect(config.access?.create).toBe(isAdmin);
  });
});
