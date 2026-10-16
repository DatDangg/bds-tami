import { describe, expect, it } from "vitest";
import { normalizeSearchText } from "./normalize";

describe("normalizeSearchText", () => {
  it.each([
    ["Căn hộ dịch vụ Quận 1", "can ho dich vu quan 1"],
    ["ĐƯỜNG Đồng Khởi", "duong dong khoi"],
    ["đ Đ", "d d"],
    ["  nhiều \t khoảng\n trắng  ", "nhieu khoang trang"],
    ["", ""],
    ["   ", ""],
    ["Studio 🌇 view", "studio 🌇 view"],
    ["Vinhomes Grand Park (S2.05)", "vinhomes grand park (s2.05)"],
    ["Studio 30m² view", "studio 30m² view"], // ² giữ nguyên như unaccent của Postgres
    ["TP.HCM", "tp.hcm"],
    ["Nguyễn Thị Ánh Tuyết", "nguyen thi anh tuyet"],
  ])("normalizeSearchText(%j) -> %j", (input, expected) => {
    expect(normalizeSearchText(input)).toBe(expected);
  });

  it("NFD và NFC cho cùng kết quả", () => {
    const text = "Phường Bến Nghé";
    expect(normalizeSearchText(text.normalize("NFD"))).toBe(normalizeSearchText(text.normalize("NFC")));
  });

  it("idempotent", () => {
    const once = normalizeSearchText("Quận Thủ Đức");
    expect(normalizeSearchText(once)).toBe(once);
  });
});
