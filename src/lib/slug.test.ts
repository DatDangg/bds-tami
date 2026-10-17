import { describe, expect, it } from "vitest";
import { appendUniqueSuffix, SLUG_MAX_LENGTH, slugify, suffixedSlug } from "./slug";

describe("slugify", () => {
  it.each([
    ["Căn hộ dịch vụ Quận 1", "can-ho-dich-vu-quan-1"],
    ["Đường Đồng Khởi", "duong-dong-khoi"],
    ["ĐẶNG THỊ NHU", "dang-thi-nhu"],
    ["Phường Bến Nghé, Quận 1", "phuong-ben-nghe-quan-1"],
    ["  nhiều   khoảng    trắng  ", "nhieu-khoang-trang"],
    ["a---b___c", "a-b-c"],
    ["--Mở đầu & kết thúc--", "mo-dau-ket-thuc"],
    ["Vinhomes Grand Park (S2.05)", "vinhomes-grand-park-s2-05"],
    ["v1.2.3", "v1-2-3"],
    ["file.name.html", "file-name-html"],
    ["Studio 30m² view sông 🌇", "studio-30m2-view-song"],
    ["Luxury Apartment in District 1", "luxury-apartment-in-district-1"],
    ["Café Résumé Ñandú", "cafe-resume-nandu"],
    ["Nguyễn Văn Ạ Ắ Ằ Ẳ Ẵ Ặ", "nguyen-van-a-a-a-a-a-a"],
    ["Ở đây có Ừ Ữ Ự Ỳ Ỷ Ỹ Ỵ", "o-day-co-u-u-u-y-y-y-y"],
  ])("slugify(%j) -> %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("nhận chuỗi đã tách dấu (NFD) giống chuỗi đã gộp (NFC)", () => {
    const nfc = "Quận Bình Thạnh đẹp";
    expect(slugify(nfc.normalize("NFD"))).toBe(slugify(nfc.normalize("NFC")));
    expect(slugify(nfc)).toBe("quan-binh-thanh-dep");
  });

  it("trả chuỗi rỗng khi không còn ký tự hợp lệ (rỗng, chỉ ký tự đặc biệt, chỉ emoji)", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
    expect(slugify("!!!@@@###")).toBe("");
    expect(slugify("🏠🏠")).toBe("");
  });

  it("không bao giờ chứa dấu chấm (matcher proxy bỏ qua path có `.`) hay ký tự ngoài [a-z0-9-]", () => {
    const hostile = ["a.b.c", ".hidden", "x..y", "robots.txt", "../etc/passwd", "a/b\\c?d=e#f", "%2e%2e", "ａｂｃ.ｄ"];
    for (const input of hostile) {
      const slug = slugify(input);
      expect(slug).not.toContain(".");
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$|^$/);
    }
  });

  it("cắt theo độ dài tối đa và không để lại gạch nối ở đầu/cuối", () => {
    const slug = slugify("căn hộ ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.startsWith("can-ho")).toBe(true);
  });

  it("tôn trọng maxLength tuỳ chọn, không để gạch nối cuối khi cắt", () => {
    expect(slugify("ab ".repeat(100), 10)).toBe("ab-ab-ab");
    expect(slugify("abcdefghij", 4)).toBe("abcd");
    expect(slugify("ab-cdefghij", 3)).toBe("ab");
  });

  it("idempotent: slugify(slugify(x)) === slugify(x)", () => {
    for (const input of ["Căn hộ dịch vụ Quận 1", "v1.2.3", "Đ-Đ  Đ"]) {
      expect(slugify(slugify(input))).toBe(slugify(input));
    }
  });
});

describe("appendUniqueSuffix", () => {
  it("giữ nguyên khi chưa ai dùng", () => {
    expect(appendUniqueSuffix("can-ho", new Set())).toBe("can-ho");
    expect(appendUniqueSuffix("can-ho", new Set(["can-ho-2"]))).toBe("can-ho");
  });

  it("thêm hậu tố nhỏ nhất còn trống bắt đầu từ -2", () => {
    expect(appendUniqueSuffix("can-ho", new Set(["can-ho"]))).toBe("can-ho-2");
    expect(appendUniqueSuffix("can-ho", new Set(["can-ho", "can-ho-2", "can-ho-3"]))).toBe("can-ho-4");
    expect(appendUniqueSuffix("can-ho", new Set(["can-ho", "can-ho-3"]))).toBe("can-ho-2");
  });

  it("cắt phần gốc để slug có hậu tố vẫn ≤ maxLength", () => {
    const base = "a".repeat(SLUG_MAX_LENGTH);
    const result = appendUniqueSuffix(base, new Set([base]));
    expect(result).toHaveLength(SLUG_MAX_LENGTH);
    expect(result.endsWith("-2")).toBe(true);
  });
});

describe("suffixedSlug", () => {
  it("ghép -n và cắt phần gốc cho vừa maxLength", () => {
    expect(suffixedSlug("can-ho", 2)).toBe("can-ho-2");
    const long = "a".repeat(SLUG_MAX_LENGTH);
    expect(suffixedSlug(long, 12)).toBe(`${"a".repeat(SLUG_MAX_LENGTH - 3)}-12`);
    expect(suffixedSlug("ab-cd", 2, 5)).toBe("ab-2");
  });
});
