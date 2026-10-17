import type { FieldHook, Where } from "payload";
import { describe, expect, it } from "vitest";

import { scopeSlugField } from "./scope-slug";
import { type SlugFieldOptions, slugField } from "./slug";

interface FindArgs {
  where: { and: Where[] };
  trash: boolean;
}

/** `payload.find` giả: ghi lại truy vấn và trả về các slug đang bị chiếm nằm trong danh sách `in`. */
function fakeRequest(occupied: string[]) {
  const queries: FindArgs[] = [];
  const req = {
    locale: "vi",
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
  args: { value?: unknown; siblingData?: Record<string, unknown>; originalDoc?: Record<string, unknown>; occupied?: string[] },
) {
  const { req, queries } = fakeRequest(args.occupied ?? []);
  const hook = slugField(options).hooks?.beforeValidate?.[0] as FieldHook;
  const result = await hook({
    value: args.value,
    siblingData: args.siblingData ?? {},
    originalDoc: args.originalDoc,
    req,
    collection: { slug: "news", flattenedFields: [{ name: "scope", type: "select", options: ["news", "rental"] }] },
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
