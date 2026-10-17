import { describe, expect, it } from "vitest";

import { matchKey, normalizeToneOrthography } from "../../scripts/admin-units/vietnamese-key";

describe("normalizeToneOrthography (vị trí dấu thanh kiểu cũ -> kiểu mới)", () => {
  it.each([
    ["hoà", "hòa"],
    ["hoá", "hóa"],
    ["khoẻ", "khỏe"],
    ["thuỷ", "thủy"],
    ["quỳ", "quỳ"],
    ["uý", "úy"],
    ["huỳnh", "huỳnh"],
    ["Thanh Hoá", "thanh hóa"],
    ["Thanh Hóa", "thanh hóa"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeToneOrthography(input)).toBe(expected);
  });

  it("đặt dấu đúng nguyên âm: âm có dấu phụ, âm giữa cụm 3, phụ âm cuối, qu/gi", () => {
    expect(normalizeToneOrthography("Việt")).toBe("việt");
    expect(normalizeToneOrthography("Nguyễn")).toBe("nguyễn");
    expect(normalizeToneOrthography("tươi")).toBe("tươi");
    expect(normalizeToneOrthography("ngoài")).toBe("ngoài");
    expect(normalizeToneOrthography("hoàn")).toBe("hoàn");
    expect(normalizeToneOrthography("toán")).toBe("toán");
    expect(normalizeToneOrthography("giàng")).toBe("giàng");
    expect(normalizeToneOrthography("quý")).toBe("quý");
    expect(normalizeToneOrthography("quyền")).toBe("quyền");
    expect(normalizeToneOrthography("gìn")).toBe("gìn");
  });

  it("chuỗi NFD và NFC cho cùng kết quả", () => {
    expect(normalizeToneOrthography("Hoà".normalize("NFD"))).toBe(normalizeToneOrthography("Hòa".normalize("NFC")));
  });
});

describe("matchKey", () => {
  it("giữ chữ cái gốc và dấu thanh: các tên chỉ khác dấu vẫn là khoá khác nhau", () => {
    const pairs = [
      ["Xã Cẩm Giang", "Xã Cẩm Giàng"],
      ["Xã Văn Lang", "Xã Văn Lăng"],
      ["Xã Sơn Hạ", "Xã Sơn Hà"],
      ["Xã Ba Tô", "Xã Ba Tơ"],
      ["Xã Lộc Thành", "Xã Lộc Thạnh"],
      ["Xã Thạnh An", "Xã Thanh An"],
      ["Xã Tân Thành", "Xã Tân Thạnh"],
      ["Đặc khu Cô Tô", "Đặc khu Co To"],
    ] as const;
    for (const [a, b] of pairs) expect(matchKey(a)).not.toBe(matchKey(b));
  });

  it("gộp các khác biệt chỉ là chính tả hiển thị", () => {
    expect(matchKey("Phường Hoà Bình")).toBe(matchKey("Phường Hòa Bình"));
    expect(matchKey("Xã  Thuỷ   Xuân")).toBe(matchKey("xã thủy xuân"));
    expect(matchKey("Xã Ea M’droh")).toBe(matchKey("Xã Ea M'droh"));
    expect(matchKey("Xã Chân Mây – Lăng Cô")).toBe(matchKey("Xã Chân Mây - Lăng Cô"));
    expect(matchKey("Tp Hồ Chí Minh")).toBe(matchKey("Thành phố Hồ Chí Minh"));
    expect(matchKey("Tp. Huế")).toBe(matchKey("Thành phố Huế"));
  });
});
