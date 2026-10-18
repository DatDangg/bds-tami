import type { PayloadRequest } from "payload";
import { describe, expect, it } from "vitest";

import { asSystemActivity, isSystemActivity } from "./lead-activity-hooks";

const fakeRequest = () => ({ context: {} }) as unknown as PayloadRequest;
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

describe("asSystemActivity (bộ đếm)", () => {
  it("bật trong lúc chạy, tắt sau đó", async () => {
    const req = fakeRequest();
    expect(isSystemActivity(req)).toBe(false);
    await asSystemActivity(req, async () => expect(isSystemActivity(req)).toBe(true));
    expect(isSystemActivity(req)).toBe(false);
  });

  it("lỗi bên trong vẫn trả bộ đếm về 0", async () => {
    const req = fakeRequest();
    await expect(asSystemActivity(req, () => Promise.reject(new Error("lỗi")))).rejects.toThrow("lỗi");
    expect(isSystemActivity(req)).toBe(false);
  });

  it("chạy song song trên cùng req: lần xong trước không tắt cờ của lần còn chạy", async () => {
    const req = fakeRequest();
    let seenByLongRun = false;
    const longRun = asSystemActivity(req, async () => {
      await tick();
      await tick();
      seenByLongRun = isSystemActivity(req);
    });
    await Promise.all([asSystemActivity(req, tick), longRun]);
    expect(seenByLongRun).toBe(true);
    expect(isSystemActivity(req)).toBe(false);
  });

  it("lồng nhau: lần trong kết thúc vẫn còn cờ của lần ngoài", async () => {
    const req = fakeRequest();
    await asSystemActivity(req, async () => {
      await asSystemActivity(req, async () => undefined);
      expect(isSystemActivity(req)).toBe(true);
    });
    expect(isSystemActivity(req)).toBe(false);
  });
});
