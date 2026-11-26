import type { FieldHook, Where } from "payload";
import { describe, expect, it } from "vitest";

import { scopeSlugField } from "./scope-slug";
import { slugify, suffixedSlug } from "../lib/slug";
import { type SlugFieldOptions, slugField } from "./slug";

interface FindArgs {
  where: { and: Where[] };
  trash: boolean;
}

/** `payload.find` giả: ghi lại truy vấn và trả về các slug đang bị chiếm nằm trong danh sách `in`. */
function fakeRequest(occupied: string[], locale = "vi") {
  const queries: FindArgs[] = [];
  const req = {
    locale,
    fallbackLocale: false,
    payload: {
      find: async (args: FindArgs) => {
        queries.push(args);
        const clause = args.where.and[0] as { slug: { in: string[] } };
        return { docs: clause.slug.in.filter((slug) => occupied.includes(slug)).map((slug) => ({ slug })) };
      },
    },
  };
  return { req, queries };
}

async function runSlugHook(
  options: SlugFieldOptions,
  args: { value?: unknown; siblingData?: Record<string, unknown>; originalDoc?: Record<string, unknown>; occupied?: string[]; collectionSlug?: string; locale?: string },
) {
  const { req, queries } = fakeRequest(args.occupied ?? [], args.locale);
  const hook = slugField(options).hooks?.beforeValidate?.[0] as FieldHook;
  const result = await hook({
    value: args.value,
    siblingData: args.siblingData ?? {},
    originalDoc: args.originalDoc,
    req,
    collection: { slug: args.collectionSlug ?? "news", flattenedFields: [{ name: "scope", type: "select", options: ["news", "rental"] }] },
  } as unknown as Parameters<FieldHook>[0]);
  return { result, queries };
}

describe("slugField: kiểm trùng slug (n1)", () => {
  it("chỉ truy vấn bằng `in` trên danh sách ứng viên, không dùng like/contains (ILIKE %x%)", async () => {
    const { queries } = await runSlugHook({}, { siblingData: { title: "Căn hộ" } });
    expect(queries).toHaveLength(1);
    const text = JSON.stringify(queries[0]!.where);
    expect(text).not.toMatch(/"(like|contains)"/);
    const clause = queries[0]!.where.and[0] as { slug: { in: string[] } };
    expect(clause.slug.in.slice(0, 3)).toEqual(["can-ho", "can-ho-2", "can-ho-3"]);
    expect(queries[0]!.trash).toBe(true);
  });

  it("chưa ai dùng: giữ nguyên, đúng một truy vấn", async () => {
    const { result, queries } = await runSlugHook({}, { siblingData: { title: "Căn hộ" } });
    expect(result).toBe("can-ho");
    expect(queries).toHaveLength(1);
  });

  it("trùng thì lấy hậu tố nhỏ nhất còn trống", async () => {
    const { result } = await runSlugHook({}, { siblingData: { title: "Căn hộ" }, occupied: ["can-ho", "can-ho-2", "can-ho-4"] });
    expect(result).toBe("can-ho-3");
  });

  it("hơn một lượt ứng viên bị chiếm hết: hỏi tiếp lượt kế", async () => {
    const occupied = ["can-ho", ...Array.from({ length: 24 }, (_, i) => `can-ho-${i + 2}`)];
    const { result, queries } = await runSlugHook({}, { siblingData: { title: "Căn hộ" }, occupied });
    expect(result).toBe("can-ho-26");
    expect(queries).toHaveLength(2);
  });

  it("bỏ qua chính bản ghi đang sửa", async () => {
    const { queries } = await runSlugHook({}, { siblingData: { title: "A" }, originalDoc: { id: "doc-1" } });
    expect(queries[0]!.where.and).toContainEqual({ id: { not_equals: "doc-1" } });
  });

  it("slug dài 80 ký tự vẫn ra ứng viên có hậu tố ≤ 80 ký tự", async () => {
    const long = "a".repeat(80);
    const { result } = await runSlugHook({}, { value: long, occupied: [long] });
    expect(result).toBe(`${"a".repeat(78)}-2`);
  });
});

describe("slugField: slug dành riêng của Dự án (BL-090)", () => {
  it("dự án vi 'danh-muc' → 'danh-muc-2' (trùng URL trang danh mục /du-an/danh-muc/[category]); en 'category' → 'category-2'", async () => {
    const vi = await runSlugHook({}, { collectionSlug: "projects", value: "danh-muc" });
    expect(vi.result).toBe("danh-muc-2");
    const en = await runSlugHook({}, { collectionSlug: "projects", locale: "en", value: "category" });
    expect(en.result).toBe("category-2");
  });

  it("sinh từ tiêu đề 'Danh mục' cũng bị đổi; 'danh-muc-2' đã bị chiếm thật thì lên 'danh-muc-3'", async () => {
    expect((await runSlugHook({}, { collectionSlug: "projects", siblingData: { title: "Danh mục" } })).result).toBe("danh-muc-2");
    expect((await runSlugHook({}, { collectionSlug: "projects", value: "danh-muc", occupied: ["danh-muc-2"] })).result).toBe("danh-muc-3");
  });

  it("chỉ chặn đúng ngôn ngữ: vi 'category' và en 'danh-muc' giữ nguyên; slug khác không đổi", async () => {
    expect((await runSlugHook({}, { collectionSlug: "projects", value: "category" })).result).toBe("category");
    expect((await runSlugHook({}, { collectionSlug: "projects", locale: "en", value: "danh-muc" })).result).toBe("danh-muc");
    expect((await runSlugHook({}, { collectionSlug: "projects", value: "vinhomes" })).result).toBe("vinhomes");
  });

  it("collection khác (news, rentals) không bị ảnh hưởng", async () => {
    expect((await runSlugHook({}, { collectionSlug: "news", value: "danh-muc" })).result).toBe("danh-muc");
    expect((await runSlugHook({}, { collectionSlug: "rentals", locale: "en", value: "category" })).result).toBe("category");
  });
});

describe("slugField: scopeField", () => {
  it("lọc kiểm trùng theo scope của dữ liệu đang ghi", async () => {
    const { queries } = await runSlugHook({ scopeField: "scope", sourceField: "name" }, { siblingData: { name: "Studio", scope: "rental" } });
    expect(queries[0]!.where.and).toContainEqual({ scope: { equals: "rental" } });
  });

  it("cập nhật một phần: scope lấy từ bản ghi đã lưu", async () => {
    const { queries } = await runSlugHook(
      { scopeField: "scope", sourceField: "name" },
      { siblingData: {}, originalDoc: { id: "c-1", name: "Studio", scope: "news" } },
    );
    expect(queries[0]!.where.and).toContainEqual({ scope: { equals: "news" } });
  });

  it("trùng ở scope khác không tính (truy vấn đã lọc scope nên DB chỉ trả bản cùng scope)", async () => {
    const { result } = await runSlugHook({ scopeField: "scope", sourceField: "name" }, { siblingData: { name: "Studio", scope: "news" } });
    expect(result).toBe("studio");
  });

  it("chưa có scope: không so trùng, để validate của trường scope báo lỗi", async () => {
    const { result, queries } = await runSlugHook({ scopeField: "scope", sourceField: "name" }, { siblingData: { name: "Studio" } });
    expect(result).toBe("studio");
    expect(queries).toHaveLength(0);
  });

  it("scope ngoài danh sách chọn: không truy vấn (tránh 500 từ cột enum), để validate select báo 400", async () => {
    const { result, queries } = await runSlugHook(
      { scopeField: "scope", sourceField: "name" },
      { siblingData: { name: "Studio", scope: "khong-co" } },
    );
    expect(result).toBe("studio");
    expect(queries).toHaveLength(0);
  });

  it("slug không unique toàn collection khi có scopeField", () => {
    expect(slugField({ scopeField: "scope" }).unique).toBe(false);
    expect(slugField().unique).toBe(true);
  });
});

describe("slugField: nhân bản (Duplicate)", () => {
  it("bỏ slug (undefined) thay vì thêm ' - Copy' mặc định của Payload cho trường unique, để hook sinh lại + hậu tố", async () => {
    const [hook] = slugField().hooks?.beforeDuplicate ?? [];
    expect(hook).toBeDefined();
    expect(await hook!({ value: "xyz" } as unknown as Parameters<FieldHook>[0])).toBeUndefined();
  });
});

describe("scopeSlugField", () => {
  const hook = scopeSlugField("scope").hooks?.beforeChange?.[0] as FieldHook;
  const run = (siblingData: Record<string, unknown>, originalDoc?: Record<string, unknown>) =>
    hook({ siblingData, originalDoc } as unknown as Parameters<FieldHook>[0]);

  it("ghép scope/slug từ dữ liệu đang ghi, rơi về bản đã lưu khi thiếu", async () => {
    expect(await run({ scope: "rental", slug: "studio" })).toBe("rental/studio");
    expect(await run({ slug: "moi" }, { scope: "news", slug: "cu" })).toBe("news/moi");
    expect(await run({}, { scope: "news", slug: "cu" })).toBe("news/cu");
  });

  it("chưa có slug (bản en chưa dịch): null để nhiều bản trống không đụng UNIQUE", async () => {
    expect(await run({ scope: "rental", slug: null })).toBeNull();
    expect(await run({ scope: "rental" })).toBeNull();
  });
});

describe("slugField: nhân bản rồi đổi tiêu đề (BL-128)", () => {
  const draftCopy = { id: "d-2", title: "Trưởng nhóm kinh doanh đã đóng", slug: "truong-nhom-kinh-doanh-da-dong-3", status: "draft", publishedAt: null };

  it("bản sao chưa xuất bản, slug tự sinh từ tiêu đề cũ, đổi tiêu đề → slug theo tiêu đề mới", async () => {
    const { result } = await runSlugHook({}, { value: draftCopy.slug, siblingData: { title: "Chuyên viên tư vấn" }, originalDoc: draftCopy });
    expect(result).toBe("chuyen-vien-tu-van");
  });

  it("slug mới trùng thì vẫn thêm hậu tố", async () => {
    const { result } = await runSlugHook({}, { value: draftCopy.slug, siblingData: { title: "Chuyên viên tư vấn" }, originalDoc: draftCopy, occupied: ["chuyen-vien-tu-van"] });
    expect(result).toBe("chuyen-vien-tu-van-2");
  });

  it("slug tự sinh không hậu tố cũng sinh lại", async () => {
    const { result } = await runSlugHook({}, { value: "a-b", siblingData: { title: "C D" }, originalDoc: { id: "x", title: "A B", slug: "a-b", status: "draft" } });
    expect(result).toBe("c-d");
  });

  it("bản đã xuất bản đổi tiêu đề: giữ slug (URL ổn định)", async () => {
    const { result } = await runSlugHook({}, { value: draftCopy.slug, siblingData: { title: "Chuyên viên tư vấn" }, originalDoc: { ...draftCopy, status: "published" } });
    expect(result).toBe(draftCopy.slug);
  });

  it("đã từng xuất bản (có publishedAt) rồi chuyển nháp: giữ slug", async () => {
    const { result } = await runSlugHook({}, { value: draftCopy.slug, siblingData: { title: "Chuyên viên tư vấn" }, originalDoc: { ...draftCopy, publishedAt: "2026-10-18T00:00:00.000Z" } });
    expect(result).toBe(draftCopy.slug);
  });

  it("bản nháp người dùng tự sửa slug: giữ slug tự sửa", async () => {
    const { result } = await runSlugHook({}, { value: "slug-tu-chon", siblingData: { title: "Chuyên viên tư vấn" }, originalDoc: { ...draftCopy, slug: "slug-tu-chon" } });
    expect(result).toBe("slug-tu-chon");
  });

  it("người dùng gõ slug mới khác slug đã lưu: dùng slug gõ", async () => {
    const { result } = await runSlugHook({}, { value: "tu-go", siblingData: { title: "Chuyên viên tư vấn" }, originalDoc: draftCopy });
    expect(result).toBe("tu-go");
  });

  it("slug tự rút gọn (tiền tố của slug tự sinh): giữ khi đổi tiêu đề", async () => {
    const { result } = await runSlugHook({}, { value: "truong-nhom", siblingData: { title: "Chuyên viên tư vấn" }, originalDoc: { ...draftCopy, slug: "truong-nhom" } });
    expect(result).toBe("truong-nhom");
  });

  it("slug tự sinh dài bị cắt kèm hậu tố: vẫn sinh lại", async () => {
    const longTitle = "tuyendung".repeat(10);
    const storedSlug = suffixedSlug(slugify(longTitle), 3);
    expect(storedSlug.length).toBeLessThanOrEqual(80);
    expect(storedSlug.startsWith(slugify(longTitle))).toBe(false);
    const { result } = await runSlugHook({}, { value: storedSlug, siblingData: { title: "Chuyên viên tư vấn" }, originalDoc: { id: "x", title: longTitle, slug: storedSlug, status: "draft" } });
    expect(result).toBe("chuyen-vien-tu-van");
  });

  it("bản Cho thuê trạng thái rented chưa có publishedAt: giữ slug", async () => {
    const { result } = await runSlugHook({}, { value: draftCopy.slug, siblingData: { title: "Chuyên viên tư vấn" }, originalDoc: { ...draftCopy, status: "rented" } });
    expect(result).toBe(draftCopy.slug);
  });

  it("bản hidden chưa có publishedAt: sinh lại", async () => {
    const { result } = await runSlugHook({}, { value: draftCopy.slug, siblingData: { title: "Chuyên viên tư vấn" }, originalDoc: { ...draftCopy, status: "hidden" } });
    expect(result).toBe("chuyen-vien-tu-van");
  });

  it("tiêu đề không đổi: giữ slug", async () => {
    const { result } = await runSlugHook({}, { value: draftCopy.slug, siblingData: { title: draftCopy.title }, originalDoc: draftCopy });
    expect(result).toBe(draftCopy.slug);
  });
});

describe("slugField: beforeDuplicate vẫn bỏ slug", () => {
  it("trả undefined", () => {
    const hook = slugField().hooks?.beforeDuplicate?.[0] as FieldHook;
    expect(hook({} as Parameters<FieldHook>[0])).toBeUndefined();
  });
});
