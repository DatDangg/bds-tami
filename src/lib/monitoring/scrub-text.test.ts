import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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

  it("không dùng regex lookbehind (Safari/iOS < 16.4 không nạp được module)", () => {
    const source = readFileSync(fileURLToPath(new URL("./scrub-text.ts", import.meta.url)), "utf8");
    const code = source
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("//"))
      .join("\n");
    expect(code).not.toMatch(/\(\?<[!=]/);
  });

  it("ngày không bắt đầu giữa dãy số: dãy số dính liền ngày vẫn theo luật SĐT", () => {
    expect(scrubText("id:2026-10-17")).toBe("id:2026-10-17");
    expect(scrubText("2026-10-17-2026-10-17")).toBe("2026-10-17-2026-10-17");
    expect(scrubText("x12026-10-17")).toBe("x[phone]");
    expect(scrubText("9172026-10-17 x")).toBe("[phone] x");
    expect(scrubText("51.1.2026")).toBe("51.1.2026");
    expect(scrubText("1.1.2026 2.2.2026 0901234567")).toBe("1.1.2026 2.2.2026 [phone]");
  });

  it("không che nhầm số dài từ 12 chữ số (timestamp ms, đoạn cuối UUID, số tài khoản)", () => {
    expect(scrubText("ts 1760000000000")).toBe("ts 1760000000000");
    expect(scrubText("uuid 550e8400-e29b-41d4-a716-446655440000")).toBe("uuid 550e8400-e29b-41d4-a716-446655440000");
    expect(scrubText("stk 970412345678901")).toBe("stk 970412345678901");
  });

  it("vẫn che SĐT dính liền một dãy ID dài", () => {
    expect(scrubText("1760000000000 0901234567")).toBe("[phone]");
  });

  it("luôn che SĐT VN dạng liền 12-13 chữ số (E.164 cố định, 0084, +840)", () => {
    for (const phone of ["+842838234567", "842838234567", "0084912345678", "00842838234567", "+840912345678", "+84 28 3823 4567", "+84 91 234 5678", "+84.28.3823.4567", "+840 912 345 678"]) {
      expect(scrubText(phone)).toBe("[phone]");
      expect(scrubText(`gọi ${phone}.`)).toBe("gọi [phone].");
    }
  });

  it("che SĐT trong JSON, URL query, sau chữ cái và lỗi unique Postgres", () => {
    expect(scrubText('{"phone":"+842838234567","x":1}')).toBe('{"phone":"[phone]","x":1}');
    expect(scrubText("/api/leads?phone=%2B84912345678&a=1")).not.toMatch(/912345678/);
    expect(scrubText("phone=84912345678")).toBe("phone=[phone]");
    expect(scrubText("phone=0084912345678&x")).toBe("phone=[phone]&x");
    expect(scrubText("ABC0912345678")).toBe("ABC[phone]");
    expect(scrubText("duplicate key: Key (phone_normalized)=(+84912345678) already exists.")).toBe(
      "duplicate key: Key (phone_normalized)=([phone]) already exists.",
    );
    expect(scrubText("Key (phone_normalized)=(+842838234567) already exists")).not.toMatch(/2838234567/);
  });

  it("che SĐT có mã vùng trong ngoặc", () => {
    expect(scrubText("tel (028) 3823 4567.")).toBe("tel [phone].");
    expect(scrubText("2026-10-17 (028) 3823 4567")).toBe("2026-10-17 [phone]");
  });

  it("cắt đầu vào dài trước khi chạy regex", () => {
    const long = "1 ".repeat(100_000);
    const result = scrubText(long);
    expect(result.length).toBeLessThan(MAX_SCRUB_LENGTH + 50);
  });
});
