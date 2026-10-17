import { describe, expect, it } from "vitest";

import { MAX_SCRUB_LENGTH, scrubText } from "./scrub-text";

describe("scrubText", () => {
  it("che email và SĐT các dạng hay gặp", () => {
    expect(scrubText("a@b.vn gọi 0901234567, +84 901 234 567, 0901.234.567")).toBe(
      "[email] gọi [phone], [phone], [phone]",
    );
  });

  it("không che nhầm ngày tháng và số ngắn", () => {
    const text = "lúc 2026-10-17 10:30, hạn 17-10-2026, 17/10/2026, 17.10.2026, id 12345";
    expect(scrubText(text)).toBe(text);
  });

  it("vẫn che SĐT đứng liền sau ngày tháng (không để ngày làm lọt SĐT)", () => {
    for (const text of [
      "2026-10-17 0901234567",
      "2026-10-17 +84901234567",
      "2026-10-17 +84 901 234 567",
      "17-10-2026 0901 234 567",
      "17.10.2026 0901.234.567",
      "17.10.2026 0901234567",
      "2026-10-17  0901234567",
      "2026-10-17 10:30 gọi 0901234567",
    ]) {
      expect(scrubText(text)).toContain("[phone]");
      expect(scrubText(text)).not.toMatch(/0901|901 234|901234/);
    }
    expect(scrubText("2026-10-17 0901234567")).toBe("2026-10-17 [phone]");
    expect(scrubText("17-10-2026 0901 234 567")).toBe("17-10-2026 [phone]");
    expect(scrubText("lúc 2026-10-17 10:30")).toBe("lúc 2026-10-17 10:30");
  });

  it("cắt đầu vào dài trước khi chạy regex", () => {
    const long = "1 ".repeat(100_000);
    const result = scrubText(long);
    expect(result.length).toBeLessThan(MAX_SCRUB_LENGTH + 50);
  });
});
