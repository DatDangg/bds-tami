import { describe, expect, it } from "vitest";
import { normalizeSearchText } from "./normalize";
import { UNACCENT_FROM, UNACCENT_TO } from "./unaccent-sql";

describe("bảng translate() bỏ dấu tiếng Việt", () => {
  it("hai chuỗi cùng số ký tự, mỗi ký tự đích là một chữ ASCII thường", () => {
    expect([...UNACCENT_FROM]).toHaveLength([...UNACCENT_TO].length);
    expect(UNACCENT_TO).toMatch(/^[a-z]+$/);
  });

  it("áp bảng lên chuỗi rồi lower() cho cùng kết quả normalizeSearchText (trừ gộp khoảng trắng)", () => {
    const map = new Map([...UNACCENT_FROM].map((char, index) => [char, [...UNACCENT_TO][index]]));
    const emulate = (text: string) => [...text].map((char) => map.get(char) ?? char).join("").toLowerCase();
    for (const text of ["Thị trường căn hộ Hà Nội quý III", "ĐỒNG ANH lên quận", "Sổ hồng lâu dài và 50 năm", "Lãi suất vay mua nhà cuối năm 2026: xu hướng"]) {
      expect(emulate(text)).toBe(normalizeSearchText(text));
    }
  });
});
