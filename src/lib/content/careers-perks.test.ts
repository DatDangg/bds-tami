import { describe, expect, it } from "vitest";

import { resolveCareersPerks } from "./careers-perks";

describe("resolveCareersPerks", () => {
  it("giữ mục có tiêu đề, cắt khoảng trắng, mô tả trống → null", () => {
    const perks = resolveCareersPerks({
      careersPerks: [
        { id: "1", icon: "star", title: " Lương thưởng ", description: " Cạnh tranh " },
        { id: "2", icon: "users", title: "Đội ngũ", description: "" },
      ],
    });
    expect(perks).toEqual([
      { icon: "star", title: "Lương thưởng", description: "Cạnh tranh" },
      { icon: "users", title: "Đội ngũ", description: null },
    ]);
  });

  it("/en: mục thiếu title EN bị bỏ (không lấy chữ Việt); còn < 2 mục → null (ẩn dải)", () => {
    expect(
      resolveCareersPerks({
        careersPerks: [
          { id: "1", icon: "star", title: "Pay" },
          { id: "2", icon: "users", title: "" },
        ],
      }),
    ).toBeNull();
  });

  it("không có dữ liệu → null", () => {
    expect(resolveCareersPerks({})).toBeNull();
    expect(resolveCareersPerks(null)).toBeNull();
  });
});
