import type { CollectionConfig, Field } from "payload";
import { describe, expect, it } from "vitest";

import { isAdmin } from "../../access";
import { findLayoutField, flattenLayoutFields } from "../../lib/admin/form-layout";
import { withContentDefaults } from "./content-defaults";

const base: CollectionConfig = { slug: "news", fields: [{ name: "title", type: "text", localized: true }] };
// Tìm xuyên vỏ bố cục không tên (slug nằm trong khối "Nâng cao" thu gọn).
const find = (config: CollectionConfig, name: string) => findLayoutField(config.fields, name) as { access?: Record<string, unknown> };

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

const fieldNames = (config: CollectionConfig) =>
  flattenLayoutFields(config.fields).flatMap((field: Field) => ("name" in field ? [field.name] : []));
const denyAllAccess = () => false;

describe("withContentDefaults: fieldAccess (n2)", () => {
  it("khoá có giá trị undefined bị bỏ qua: deny-all mặc định không bị mở quyền", () => {
    const config = withContentDefaults(base, { fieldAccess: { hasEnglish: { update: undefined, create: isAdmin } } });
    const access = find(config, "hasEnglish").access;
    expect(access?.update).toBeTypeOf("function");
    expect((access?.update as () => boolean)()).toBe(false);
    expect(access?.create).toBe(isAdmin);
  });

  it("tên trường lạ (gõ sai) ném lỗi nêu rõ tên", () => {
    expect(() => withContentDefaults(base, { fieldAccess: { hasEnglsh: { update: isAdmin } } })).toThrow(/hasEnglsh/);
  });

  it("tên trường của collection (không phải trường dùng chung) cũng ném lỗi", () => {
    expect(() => withContentDefaults(base, { fieldAccess: { title: { update: isAdmin } } })).toThrow(/title/);
  });

  it("trường đã omit mà vẫn ghi đè access thì ném lỗi", () => {
    expect(() =>
      withContentDefaults({ ...base, access: { read: denyAllAccess } }, { omit: ["author"], fieldAccess: { author: { update: isAdmin } } }),
    ).toThrow(/author/);
  });
});

describe("withContentDefaults: omit (G7)", () => {
  it("mặc định có đủ trường dùng chung", () => {
    expect(fieldNames(withContentDefaults(base))).toEqual(
      expect.arrayContaining(["slug", "status", "publishedAt", "author", "isFeatured", "hasEnglish", "translation", "seo"]),
    );
  });

  it("omit bỏ đúng các trường được nêu, giữ phần còn lại", () => {
    const names = fieldNames(withContentDefaults(base, { omit: ["slug", "author"] }));
    expect(names).not.toContain("slug");
    expect(names).not.toContain("author");
    expect(names).toEqual(expect.arrayContaining(["status", "hasEnglish", "translation", "seo"]));
  });

  it("omit status mà không tự đặt access.read thì ném lỗi (mặc định lọc theo status)", () => {
    expect(() => withContentDefaults(base, { omit: ["status"] })).toThrow(/access\.read/);
    const config = withContentDefaults({ ...base, access: { read: denyAllAccess } }, { omit: ["status"] });
    expect(fieldNames(config)).not.toContain("status");
  });

  it("route: null bỏ hook làm mới cache + redirect slug, vẫn giữ hook audit", () => {
    const withRoute = withContentDefaults(base);
    const withoutRoute = withContentDefaults(base, { route: null });
    expect(withRoute.hooks?.afterChange).toHaveLength(4);
    // audit + xếp job dịch (hook dịch luôn có, không phụ thuộc route).
    expect(withoutRoute.hooks?.afterChange).toHaveLength(2);
    expect(withoutRoute.hooks?.afterDelete).toHaveLength(1);
  });

  it("collection chưa có route (không khai route) vẫn ném lỗi", () => {
    expect(() => withContentDefaults({ slug: "khong-co-route", fields: [] })).toThrow(/route/);
  });
});

describe("withContentDefaults: scopeField (G7)", () => {
  const scoped = (options = {}) => withContentDefaults({ ...base, slug: "categories" }, { route: null, scopeField: "scope", ...options });
  const slugOf = (config: CollectionConfig) => find(config, "slug") as { unique?: boolean };

  it("slug không còn unique toàn collection; thêm scopeSlug unique + localized + ẩn để DB giữ (locale, scope, slug)", () => {
    const config = scoped();
    expect(slugOf(config).unique).toBe(false);
    const scopeSlug = find(config, "scopeSlug") as { unique?: boolean; localized?: boolean; hidden?: boolean };
    expect(scopeSlug).toMatchObject({ unique: true, localized: true, hidden: true });
  });

  it("không dùng scopeField: slug vẫn unique, không có scopeSlug", () => {
    const config = withContentDefaults(base);
    expect(slugOf(config).unique).toBe(true);
    expect(fieldNames(config)).not.toContain("scopeSlug");
  });

  it("scopeField cùng omit slug ném lỗi", () => {
    expect(() => scoped({ omit: ["slug"] })).toThrow(/scopeField/);
  });

  it("fieldAccess.slug chỉ áp lên slug, không động tới scopeSlug (luôn deny-all)", () => {
    const config = scoped({ fieldAccess: { slug: { update: isAdmin } } });
    expect((find(config, "slug").access as { update?: unknown }).update).toBe(isAdmin);
    expect((find(config, "scopeSlug").access as { update: () => boolean }).update()).toBe(false);
  });
});

describe("withContentDefaults: slug trong khối Nâng cao (BL-042)", () => {
  const advancedBlock = (config: CollectionConfig) => config.fields.find((field) => field.type === "collapsible");
  const namesIn = (fields: Field[]) => fields.map((field) => ("name" in field ? field.name : null));

  it("slug nằm trong collapsible KHÔNG tên 'Nâng cao' ở cột phải, thu gọn mặc định", () => {
    const block = advancedBlock(withContentDefaults(base)) as { label?: string; admin?: { position?: string; initCollapsed?: boolean }; fields: Field[] };
    expect(block).toMatchObject({ label: "Nâng cao", admin: { position: "sidebar", initCollapsed: true } });
    expect("name" in block).toBe(false);
    expect(namesIn(block.fields)).toEqual(["slug"]);
  });

  it("có scopeField: khối chứa cả slug và scopeSlug", () => {
    const config = withContentDefaults({ ...base, slug: "categories" }, { route: null, scopeField: "scope" });
    expect(namesIn((advancedBlock(config) as { fields: Field[] }).fields)).toEqual(["slug", "scopeSlug"]);
  });

  it("omit slug thì không còn khối Nâng cao", () => {
    expect(advancedBlock(withContentDefaults(base, { omit: ["slug"] }))).toBeUndefined();
  });

  it("slug có mô tả ngắn, không đặt position riêng (đã ở khối)", () => {
    const slug = find(withContentDefaults(base), "slug") as { admin?: { description?: string; position?: string } };
    expect(slug.admin?.description).toBe("Tự tạo từ tiêu đề. Chỉ sửa khi cần đổi địa chỉ trang.");
    expect(slug.admin?.position).toBeUndefined();
  });
});

describe("withContentDefaults: vị trí ô lọc dịch (BL-021 T6)", () => {
  it("đặt TranslationStatusFilter ở beforeListTable (trong lề trang, dưới hàng tìm kiếm), không ở beforeList", () => {
    const components = withContentDefaults(base).admin?.components;
    expect(components?.beforeListTable).toEqual(["/components/admin/TranslationStatusFilter#TranslationStatusFilter"]);
    expect(components?.beforeList).toBeUndefined();
  });

  it("giữ slot beforeListTable có sẵn của collection, nối ô lọc dịch phía sau", () => {
    const config = withContentDefaults({ ...base, admin: { components: { beforeListTable: ["/x#X"] } } });
    expect(config.admin?.components?.beforeListTable).toEqual(["/x#X", "/components/admin/TranslationStatusFilter#TranslationStatusFilter"]);
  });

  it("omit translation thì không gắn ô lọc dịch", () => {
    const config = withContentDefaults(base, { omit: ["translation"] });
    expect(config.admin?.components?.beforeListTable ?? []).toEqual([]);
  });
});
