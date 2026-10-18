import { describe, expect, it } from "vitest";

import { buildLeadExportWhere, leadExportQueryFromWhere, UNSUPPORTED_FILTER_MESSAGE, parseLeadExportFilters } from "./export-filters";

const SALE_ID = "0a1b2c3d-1111-4222-8333-444455556666";
const parse = (query: string) => parseLeadExportFilters(new URLSearchParams(query));

describe("parseLeadExportFilters", () => {
  it("không tham số -> không lọc; tham số rỗng bị bỏ", () => {
    expect(parse("")).toEqual({ ok: true, filters: {} });
    expect(parse("status=&source=")).toEqual({ ok: true, filters: {} });
  });

  it("nhận đủ bộ lọc hợp lệ", () => {
    expect(parse(`status=won&source=rental&assignedTo=${SALE_ID}&createdFrom=2026-10-01T12:00:00.000Z&createdTo=2026-10-05T12:00:00.000Z`)).toEqual({
      ok: true,
      filters: { status: "won", source: "rental", assignedTo: SALE_ID, createdFrom: "2026-10-01T12:00:00.000Z", createdTo: "2026-10-05T12:00:00.000Z" },
    });
  });

  it("mốc có múi giờ khác được chuẩn hoá về UTC (cùng thời điểm với giá trị list)", () => {
    expect(parse("createdFrom=2026-10-01T19:00:00%2B07:00")).toEqual({ ok: true, filters: { createdFrom: "2026-10-01T12:00:00.000Z" } });
  });

  it("khoảng ngày so theo thời điểm thật (Date.parse), không so chuỗi", () => {
    // Cùng thời điểm ở hai múi giờ khác nhau -> bằng nhau -> hợp lệ.
    expect(parse("createdFrom=2026-10-01T19:00:00%2B07:00&createdTo=2026-10-01T12:00:00.000Z").ok).toBe(true);
    // Chuỗi `+07:00` lớn hơn chuỗi `Z` theo thứ tự ký tự nhưng thời điểm lại nhỏ hơn -> hợp lệ.
    expect(parse("createdFrom=2026-10-02T01:00:00%2B07:00&createdTo=2026-10-01T19:00:00.000Z").ok).toBe(true);
    // Ngược lại: bắt đầu (19:00Z) sau kết thúc (18:00Z) -> lỗi.
    const reversed = parse("createdFrom=2026-10-01T19:00:00.000Z&createdTo=2026-10-02T01:00:00%2B07:00");
    expect(reversed.ok).toBe(false);
    if (!reversed.ok) expect(reversed.issues[0]?.path).toEqual(["createdFrom"]);
  });

  it("năm 9999 cuộn sang +010000 khi đổi về UTC: so chuỗi sai thứ tự, so thời điểm vẫn bắt được khoảng ngược", () => {
    const result = parse("createdFrom=9999-12-31T23:00:00-05:00&createdTo=9999-12-31T23:00:00.000Z");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toEqual(["createdFrom"]);
  });

  it.each([
    ["status=hacked", "status"],
    ["source=%27%3B--", "source"],
    ["assignedTo=abc", "assignedTo"],
    ["createdFrom=2026-02-30T12:00:00.000Z", "createdFrom"],
    ["createdTo=01/02/2026", "createdTo"],
    ["createdFrom=2026-10-01", "createdFrom"],
    ["createdFrom=2026-10-01T12:00:00", "createdFrom"],
    [`createdTo=2026-10-01T12:00:00.000Z${"0".repeat(40)}`, "createdTo"],
    ["createdFrom=2026-03-02T12:00:00.000Z&createdTo=2026-03-01T12:00:00.000Z", "createdFrom"],
  ])("%s -> lỗi ở %s", (query, field) => {
    const result = parse(query);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toEqual([field]);
  });
});

describe("buildLeadExportWhere", () => {
  it("không lọc -> where rỗng; có lọc -> and, khoảng thời điểm dùng đúng >=/<= như danh sách", () => {
    expect(buildLeadExportWhere({})).toEqual({});
    expect(buildLeadExportWhere({ status: "new", createdFrom: "2026-10-01T12:00:00.000Z", createdTo: "2026-10-05T12:00:00.000Z" })).toEqual({
      and: [
        { status: { equals: "new" } },
        { createdAt: { greater_than_equal: "2026-10-01T12:00:00.000Z" } },
        { createdAt: { less_than_equal: "2026-10-05T12:00:00.000Z" } },
      ],
    });
  });
});

describe("leadExportQueryFromWhere", () => {
  const queryOf = (where: unknown) => {
    const result = leadExportQueryFromWhere(where);
    return result.ok ? result.query : null;
  };

  it("shape thật của Payload WhereBuilder: or -> and -> điều kiện", () => {
    const where = {
      or: [
        {
          and: [
            { status: { equals: "lost" } },
            { source: { equals: "project" } },
            { assignedTo: { equals: SALE_ID } },
            { createdAt: { greater_than_equal: "2026-10-01T12:00:00.000Z" } },
            { createdAt: { less_than_equal: "2026-10-05T12:00:00.000Z" } },
          ],
        },
      ],
    };
    expect(parse(queryOf(where) ?? "")).toEqual({
      ok: true,
      filters: { status: "lost", source: "project", assignedTo: SALE_ID, createdFrom: "2026-10-01T12:00:00.000Z", createdTo: "2026-10-05T12:00:00.000Z" },
    });
  });

  it("một điều kiện: or -> and, and đơn, hoặc where phẳng", () => {
    expect(queryOf({ or: [{ and: [{ status: { equals: "new" } }] }] })).toBe("status=new");
    expect(queryOf({ and: [{ status: { equals: "new" } }] })).toBe("status=new");
    expect(queryOf({ status: { equals: "new" } })).toBe("status=new");
  });

  it("không có bộ lọc -> query rỗng (xuất tất cả là đúng ý người dùng)", () => {
    expect(queryOf(undefined)).toBe("");
    expect(queryOf({})).toBe("");
    expect(queryOf({ or: [{ and: [] }] })).toBe("");
  });

  it.each([
    ["nhiều nhánh or", { or: [{ and: [{ status: { equals: "new" } }] }, { and: [{ status: { equals: "won" } }] }] }],
    ["toán tử in", { or: [{ and: [{ status: { in: ["new", "won"] } }] }] }],
    ["toán tử not_equals", { or: [{ and: [{ status: { not_equals: "new" } }] }] }],
    ["field không hỗ trợ", { or: [{ and: [{ fullName: { like: "An" } }] }] }],
    ["ngày greater_than (không gồm đầu mút)", { or: [{ and: [{ createdAt: { greater_than: "2026-01-01T00:00:00.000Z" } }] }] }],
    ["hai điều kiện trùng field", { and: [{ status: { equals: "new" } }, { status: { equals: "won" } }] }],
    ["or nhiều nhánh lồng trong and", { and: [{ status: { equals: "new" } }, { or: [{ source: { equals: "a" } }, { source: { equals: "b" } }] }] }],
    ["giá trị không phải chuỗi", { status: { equals: 5 } }],
  ])("%s -> chặn, không bỏ lặng lẽ", (_name, where) => {
    expect(leadExportQueryFromWhere(where)).toEqual({ ok: false, reason: UNSUPPORTED_FILTER_MESSAGE });
  });

  it("thông báo khoá nút nêu rõ field + toán tử hỗ trợ (đúng nhãn tiếng Việt của Payload) và thứ không hỗ trợ", () => {
    for (const expected of ["Trạng thái", "Nguồn", "Sale phụ trách", "Ngày tạo", '"bằng"', '"lớn hơn hoặc bằng"', '"nhỏ hơn hoặc bằng"', "ô tìm kiếm", '"hoặc"']) {
      expect(UNSUPPORTED_FILTER_MESSAGE).toContain(expected);
    }
  });
});
