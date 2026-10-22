import { describe, expect, it } from "vitest";

import { resolveCareersProcess } from "./careers-process";

describe("resolveCareersProcess", () => {
  it("giữ thứ tự, cắt khoảng trắng, mô tả trống → null", () => {
    expect(
      resolveCareersProcess({
        careersProcess: [
          { id: "1", icon: "file-check", title: " Gửi hồ sơ ", description: " Ứng tuyển trực tuyến " },
          { id: "2", icon: "users", title: "Phỏng vấn", description: "  " },
        ],
      }),
    ).toEqual([
      { icon: "file-check", title: "Gửi hồ sơ", description: "Ứng tuyển trực tuyến" },
      { icon: "users", title: "Phỏng vấn", description: null },
    ]);
  });

  it("/en: bước thiếu title EN bị bỏ (không lấy chữ Việt), các bước khác giữ; 1 bước vẫn hiện (không có ngưỡng tối thiểu)", () => {
    expect(
      resolveCareersProcess({
        careersProcess: [
          { id: "1", icon: "star", title: "" },
          { id: "2", icon: "medal", title: "Offer" },
        ],
      }),
    ).toEqual([{ icon: "medal", title: "Offer", description: null }]);
  });

  it("không có dữ liệu / global lỗi → rỗng; vượt 6 bước bị cắt", () => {
    expect(resolveCareersProcess(null)).toEqual([]);
    expect(resolveCareersProcess({ careersProcess: null })).toEqual([]);
    const many = Array.from({ length: 8 }, (_, index) => ({ id: String(index), icon: "star" as const, title: `B${index}` }));
    expect(resolveCareersProcess({ careersProcess: many })).toHaveLength(6);
  });
});
