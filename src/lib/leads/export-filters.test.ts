import { describe, expect, it } from "vitest";

import { buildLeadExportWhere, MAX_SEARCH_LENGTH, leadExportQueryFromWhere, UNSUPPORTED_FILTER_MESSAGE, parseLeadExportFilters } from "./export-filters";

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

describe("tham số search", () => {
  it("nguyên văn, không trim (như danh sách): SĐT có dấu cách, NBSP/tab giữ nguyên; chỉ chuỗi rỗng = không tìm", () => {
    expect(parse("search=0956%20789%20012")).toEqual({ ok: true, filters: { search: "0956 789 012" } });
    expect(parse("search=%20%200956%20")).toEqual({ ok: true, filters: { search: "  0956 " } });
    expect(parse("search=%C2%A0")).toEqual({ ok: true, filters: { search: "\u00a0" } });
    expect(parse("search=an%09")).toEqual({ ok: true, filters: { search: "an\t" } });
    expect(parse("search=")).toEqual({ ok: true, filters: {} });
    expect(parse("")).toEqual({ ok: true, filters: {} });
  });
  it("đúng độ dài tối đa thì nhận, vượt thì lỗi kèm path search", () => {
    expect(parse(`search=${"a".repeat(MAX_SEARCH_LENGTH)}`).ok).toBe(true);
    const result = parse(`search=${"a".repeat(MAX_SEARCH_LENGTH + 1)}`);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toEqual([{ path: ["search"], message: expect.stringContaining("100") }]);
  });
  it("where: chỉ tìm -> or trên 4 trường danh sách; tìm + lọc -> and (lọc, or) như danh sách ghép", () => {
    const searchOnly = buildLeadExportWhere({ search: "an" });
    expect(searchOnly).toEqual({ or: [{ code: { like: "an" } }, { fullName: { like: "an" } }, { phone: { like: "an" } }, { email: { like: "an" } }] });
    const both = buildLeadExportWhere({ status: "new", search: "an" });
    expect(both).toEqual({ and: [{ status: { equals: "new" } }, searchOnly] });
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
    ["toán tử not_equals", { or: [{ and: [{ status: { not_equals: "new" } }] }] }],
    ["field không hỗ trợ", { or: [{ and: [{ fullName: { like: "An" } }] }] }],
    ["ngày greater_than (không gồm đầu mút)", { or: [{ and: [{ createdAt: { greater_than: "2026-01-01T00:00:00.000Z" } }] }] }],
    ["hai điều kiện trùng field", { and: [{ status: { equals: "new" } }, { status: { equals: "won" } }] }],
    ["or nhiều nhánh lồng trong and", { and: [{ status: { equals: "new" } }, { or: [{ source: { equals: "a" } }, { source: { equals: "b" } }] }] }],
    ["giá trị không phải chuỗi", { status: { equals: 5 } }],
  ])("%s -> chặn, không bỏ lặng lẽ", (_name, where) => {
    expect(leadExportQueryFromWhere(where)).toEqual({ ok: false, reason: UNSUPPORTED_FILTER_MESSAGE });
  });

  it("search gửi nguyên văn (không trim); chuỗi rỗng thì bỏ; ô tìm kiếm không còn làm khoá nút", () => {
    expect(leadExportQueryFromWhere({ or: [{ and: [{ status: { equals: "new" } }] }] }, "0956 789 012")).toEqual({ ok: true, query: "status=new&search=0956+789+012" });
    expect(leadExportQueryFromWhere(undefined, "an\u00a0")).toEqual({ ok: true, query: "search=an%C2%A0" });
    expect(leadExportQueryFromWhere(undefined, "   ")).toEqual({ ok: true, query: "search=+++" });
    expect(leadExportQueryFromWhere(undefined, "")).toEqual({ ok: true, query: "" });
    expect(leadExportQueryFromWhere(undefined, undefined)).toEqual({ ok: true, query: "" });
  });

  it("search dài hơn tối đa -> khoá kèm thông báo riêng", () => {
    expect(leadExportQueryFromWhere(undefined, "a".repeat(MAX_SEARCH_LENGTH))).toEqual({ ok: true, query: `search=${"a".repeat(MAX_SEARCH_LENGTH)}` });
    expect(leadExportQueryFromWhere(undefined, "a".repeat(MAX_SEARCH_LENGTH + 1))).toEqual({ ok: false, reason: "Từ khoá tìm kiếm tối đa 100 ký tự" });
  });

  it("thông báo khoá nút nêu rõ field + toán tử hỗ trợ (đúng nhãn tiếng Việt của Payload) và thứ không hỗ trợ", () => {
    for (const expected of ["Trạng thái", "Nguồn", "Sale phụ trách", "Ngày tạo", '"bằng"', '"lớn hơn hoặc bằng"', '"nhỏ hơn hoặc bằng"', '"hoặc"']) {
      expect(UNSUPPORTED_FILTER_MESSAGE).toContain(expected);
    }
    expect(UNSUPPORTED_FILTER_MESSAGE).not.toContain("tìm kiếm");
  });
});

describe("chip Lead: status in + assignedTo exists false (BL-022 T02)", () => {
  const queryOf = (where: unknown) => {
    const result = leadExportQueryFromWhere(where);
    return result.ok ? result.query : null;
  };

  it("client: status in (mảng / chuỗi phẩy / 1 phần tử từ URL) -> statusIn, khử trùng", () => {
    expect(queryOf({ or: [{ and: [{ status: { in: ["contacted", "consulting"] } }] }] })).toBe("statusIn=contacted%2Cconsulting");
    expect(queryOf({ and: [{ status: { in: "contacted,consulting" } }] })).toBe("statusIn=contacted%2Cconsulting");
    expect(queryOf({ and: [{ status: { in: "won" } }] })).toBe("statusIn=won");
    expect(queryOf({ and: [{ status: { in: ["won", "won"] } }] })).toBe("statusIn=won");
  });

  it("client: giá trị status in có khoảng trắng (Payload không trim, danh sách rỗng) -> khoá nút, không xuất", () => {
    expect(leadExportQueryFromWhere({ and: [{ status: { in: " won" } }] })).toEqual({ ok: false, reason: UNSUPPORTED_FILTER_MESSAGE });
    expect(leadExportQueryFromWhere({ and: [{ status: { in: ["contacted", "consulting "] } }] })).toEqual({ ok: false, reason: UNSUPPORTED_FILTER_MESSAGE });
  });

  it("client: assignedTo exists false (boolean hoặc chuỗi từ URL) -> unassigned=1; exists true bị khoá", () => {
    expect(queryOf({ and: [{ assignedTo: { exists: false } }] })).toBe("unassigned=1");
    expect(queryOf({ and: [{ assignedTo: { exists: "false" } }] })).toBe("unassigned=1");
    expect(queryOf({ and: [{ status: { equals: "new" } }, { assignedTo: { exists: false } }] })).toBe("status=new&unassigned=1");
    expect(leadExportQueryFromWhere({ and: [{ assignedTo: { exists: true } }] })).toEqual({ ok: false, reason: UNSUPPORTED_FILTER_MESSAGE });
    expect(leadExportQueryFromWhere({ and: [{ assignedTo: { exists: "true" } }] })).toEqual({ ok: false, reason: UNSUPPORTED_FILTER_MESSAGE });
  });

  it("client: chip + tìm kiếm + ngày", () => {
    const where = { or: [{ and: [{ status: { in: ["contacted", "consulting"] } }, { createdAt: { greater_than_equal: "2026-10-01T12:00:00.000Z" } }] }] };
    expect(leadExportQueryFromWhere(where, "an")).toEqual({ ok: true, query: "statusIn=contacted%2Cconsulting&createdFrom=2026-10-01T12%3A00%3A00.000Z&search=an" });
  });

  it.each([
    ["status in + status equals", { and: [{ status: { in: ["won"] } }, { status: { equals: "new" } }] }],
    ["status equals + status in", { and: [{ status: { equals: "new" } }, { status: { in: ["won"] } }] }],
    ["assignedTo equals + exists false", { and: [{ assignedTo: { equals: SALE_ID } }, { assignedTo: { exists: false } }] }],
    ["exists false + assignedTo equals", { and: [{ assignedTo: { exists: false } }, { assignedTo: { equals: SALE_ID } }] }],
    ["status in rỗng", { and: [{ status: { in: [] } }] }],
    ["status in chuỗi rỗng", { and: [{ status: { in: "" } }] }],
    ["status in giá trị lạ", { and: [{ status: { in: ["won", "hacked"] } }] }],
    ["status in quá nhiều giá trị", { and: [{ status: { in: ["new", "contacted", "consulting", "won", "lost", "spam", "new"] } }] }],
    ["status in không phải chuỗi", { and: [{ status: { in: [1] } }] }],
    ["status not_in", { and: [{ status: { not_in: ["won"] } }] }],
    ["source in", { and: [{ source: { in: ["rental"] } }] }],
    ["field khác exists", { and: [{ source: { exists: false } }] }],
    ["hai status in", { and: [{ status: { in: ["won"] } }, { status: { in: ["lost"] } }] }],
  ])("client: %s -> khoá", (_name, where) => {
    expect(leadExportQueryFromWhere(where)).toEqual({ ok: false, reason: UNSUPPORTED_FILTER_MESSAGE });
  });

  it("server: statusIn + unassigned hợp lệ -> bộ lọc chuẩn hoá; build where đúng", () => {
    const result = parse("statusIn=contacted,consulting,contacted&unassigned=1");
    expect(result).toEqual({ ok: true, filters: { statusIn: ["contacted", "consulting"], unassigned: true } });
    if (!result.ok) return;
    expect(buildLeadExportWhere(result.filters)).toEqual({ and: [{ status: { in: ["contacted", "consulting"] } }, { assignedTo: { exists: false } }] });
    expect(buildLeadExportWhere({ status: "new", unassigned: true })).toEqual({ and: [{ status: { equals: "new" } }, { assignedTo: { exists: false } }] });
  });

  it.each([
    ["statusIn=won&status=new", "statusIn"],
    ["status=new&statusIn=won", "statusIn"],
    [`unassigned=1&assignedTo=${SALE_ID}`, "unassigned"],
    ["statusIn=hacked", "statusIn"],
    ["statusIn=won,,lost", "statusIn"],
    ["statusIn=,", "statusIn"],
    ["statusIn=new,contacted,consulting,won,lost,spam,new", "statusIn"],
    ["statusIn=won%27%3B--", "statusIn"],
    ["unassigned=0", "unassigned"],
    ["unassigned=true", "unassigned"],
    ["unassigned=1,2", "unassigned"],
  ])("server: %s -> 400 ở %s", (query, field) => {
    const result = parse(query);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((issue) => issue.path[0])).toContain(field);
  });

  it("server: tham số rỗng = không lọc", () => {
    expect(parse("statusIn=&unassigned=")).toEqual({ ok: true, filters: {} });
  });

  it("thông báo khoá nút nêu thêm toán tử mới đúng nhãn Payload vi", () => {
    for (const expected of ['"có trong"', '"tồn tại"', "= Sai"]) expect(UNSUPPORTED_FILTER_MESSAGE).toContain(expected);
  });
});
