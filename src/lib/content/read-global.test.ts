import type { Payload } from "payload";
import { describe, expect, it, vi } from "vitest";
import { readPublicGlobal } from "./read-global";

describe("readPublicGlobal: hình dạng truy vấn thật của global (trang chủ)", () => {
  it("không dùng `select` (mọi field, gồm ctaBanner.image) và depth >= 1 để ảnh/media được populate; đọc như khách", async () => {
    const findGlobal = vi.fn().mockResolvedValue({});
    await readPublicGlobal({ findGlobal } as unknown as Payload, "homepage", "vi");
    const args = findGlobal.mock.calls[0]![0] as Record<string, unknown>;
    // Bài học P2-T04: thiếu field trong `select` làm hỏng runtime mà test view-model không thấy.
    expect(args).not.toHaveProperty("select");
    expect(args.depth as number).toBeGreaterThanOrEqual(1);
    expect(args).toMatchObject({ slug: "homepage", locale: "vi", fallbackLocale: false, overrideAccess: false });
  });
});
