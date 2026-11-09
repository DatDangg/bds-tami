import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";

import { buildForLocale } from "./build-search-text";

/** Phường Hồng Hà sau sáp nhập, tên cũ kèm quận cũ "Quận Ba Đình" (BL-110). */
const hongHa = { name: "Phường Hồng Hà", legacyNames: [{ name: "Phường Phúc Xá, Quận Ba Đình" }] };
const baDinh = { name: "Phường Ba Đình", legacyNames: [{ name: "Phường Điện Biên, Quận Ba Đình" }] };

const reqWithWard = (ward: typeof hongHa) => {
  const findByID = vi.fn(async ({ collection, select }: { collection: string; select: Record<string, boolean> }) => {
    if (collection === "wards") return Object.fromEntries(Object.entries(ward).filter(([key]) => select[key]));
    return { name: "Thành phố Hà Nội" };
  });
  return { req: { payload: { findByID } } as unknown as PayloadRequest, findByID };
};

describe("buildForLocale — tên phường (BL-110)", () => {
  it("tin của phường có tên cũ '..., Quận Ba Đình' KHÔNG chứa 'ba dinh'", async () => {
    const { req } = reqWithWard(hongHa);
    const text = await buildForLocale(req, { code: "CT-000001", title: "Phòng trọ", address: "1 Hoàng Hoa Thám", ward: "w1", province: "p1" }, "vi");
    expect(text).toContain("hong ha");
    expect(text).not.toContain("ba dinh");
    expect(text).not.toContain("phuc xa");
  });

  it("tin của phường Ba Đình hiện hành vẫn chứa 'ba dinh', không chứa tên cũ", async () => {
    const { req } = reqWithWard(baDinh);
    const text = await buildForLocale(req, { code: "CT-000002", title: "Căn hộ", ward: "w2", province: "p1" }, "vi");
    expect(text).toContain("ba dinh");
    expect(text).not.toContain("dien bien");
  });

  it("chỉ select `name` của phường (không đọc legacyNames)", async () => {
    const { req, findByID } = reqWithWard(hongHa);
    await buildForLocale(req, { ward: "w1" }, "vi");
    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: "wards", select: { name: true } }));
  });
});
