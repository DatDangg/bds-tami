import type { Where } from "payload";
import { describe, expect, it } from "vitest";

import { expandLeadPhoneSearch } from "./phone-search";

const searchWhere = (search: string): Where => ({
  or: [{ code: { like: search } }, { fullName: { like: search } }, { phone: { like: search } }, { email: { like: search } }],
});

describe("expandLeadPhoneSearch", () => {
  it.each(["0956789012", "0956 789 012", "+84956789012", "84956789012"])("từ khoá SĐT %s thêm nhánh phoneNormalized", (search) => {
    const expanded = expandLeadPhoneSearch(searchWhere(search));
    expect(expanded).toEqual({ or: [...(searchWhere(search).or as Where[]), { phoneNormalized: { equals: "+84956789012" } }] });
  });

  it("từ khoá không phải SĐT hợp lệ (mã, tên, email, số dở dang) giữ nguyên", () => {
    for (const search of ["LD-000012", "Nguyễn", "an@x.vn", "0956"]) expect(expandLeadPhoneSearch(searchWhere(search))).toEqual(searchWhere(search));
  });

  it("nhóm or lồng trong and (search ghép với bộ lọc khác) vẫn được mở rộng, bộ lọc khác giữ nguyên", () => {
    const where: Where = { and: [{ status: { equals: "new" } }, searchWhere("0956789012")] };
    const expanded = expandLeadPhoneSearch(where) as { and: Where[] };
    expect(expanded.and[0]).toEqual({ status: { equals: "new" } });
    expect(expanded.and[1]?.or).toContainEqual({ phoneNormalized: { equals: "+84956789012" } });
  });

  it("không mở rộng khi nhóm or không tìm trên phone; where rỗng trả nguyên", () => {
    const where: Where = { or: [{ code: { like: "0956789012" } }] };
    expect(expandLeadPhoneSearch(where)).toEqual(where);
    expect(expandLeadPhoneSearch(undefined)).toBeUndefined();
  });

  it("không đổi object đầu vào", () => {
    const where = searchWhere("0956789012");
    expandLeadPhoneSearch(where);
    expect(where.or).toHaveLength(4);
  });
});
