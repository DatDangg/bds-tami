import { describe, expect, it } from "vitest";
import { isValidPersonName, normalizePersonName, personNameSchema } from "./person-name";

describe("normalizePersonName", () => {
  it("trim và gộp mọi chuỗi khoảng trắng thành 1 dấu cách", () => {
    expect(normalizePersonName("  Nguyễn   Văn \t A \n")).toBe("Nguyễn Văn A");
  });
});

describe("isValidPersonName (BL-123)", () => {
  it.each(["Nguyễn Văn A", "O'Brien", "O’Brien", "Anne-Marie", "Lê Thị Ngọc Ánh", "J. R. Smith", "An", "  Nguyễn   Văn  A  ", "Nguyễn Văn A", "李小龍"])(
    "%j hợp lệ",
    (name) => {
      expect(isValidPersonName(name)).toBe(true);
    },
  );

  it.each(["Nguyễn @An#", "090777123", "Nguyễn 2", "An_", "A", "A.", "-'", "", "   ", "An 😀", "An<script>", "Ân,", "An/Bình", "Nguyễn ٣"])("%j bị chặn", (name) => {
    expect(isValidPersonName(name)).toBe(false);
  });
});

describe("personNameSchema", () => {
  const schema = personNameSchema(10);
  it("trả bản đã chuẩn hoá", () => {
    expect(schema.parse("  An   Bình ")).toBe("An Bình");
  });
  it("độ dài tối đa tính trên bản đã chuẩn hoá", () => {
    expect(schema.safeParse("An     Bình").success).toBe(true);
    expect(schema.safeParse("Nguyen Van Anh").success).toBe(false);
  });
  it("ký tự cấm bị từ chối", () => {
    expect(schema.safeParse("An@").success).toBe(false);
    expect(schema.safeParse("123456").success).toBe(false);
  });
});
