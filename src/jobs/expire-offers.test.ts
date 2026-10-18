import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";

import { expireOffers, expireOffersTask } from "./expire-offers";
import { jobsConfig } from "./index";

describe("expire-offers: lịch chạy + đăng ký", () => {
  it("00:05 giờ VN mỗi ngày = 17:05 UTC (container jobs chạy UTC; Payload Jobs không có múi giờ riêng cho schedule)", () => {
    expect(expireOffersTask.schedule).toEqual([{ cron: "0 5 17 * * *", queue: "default" }]);
  });

  it("đã đăng ký trong jobsConfig", () => {
    expect((jobsConfig.tasks ?? []).map((task) => task.slug)).toContain("expire-offers");
  });
});

describe("expire-offers: trần số bài mỗi lần chạy", () => {
  const fakeRequest = (docCount: number) => {
    const warn = vi.fn();
    const docs = Array.from({ length: docCount }, (_, index) => ({ slug: { vi: `bai-${index}`, en: null } }));
    const req = { payload: { find: vi.fn().mockResolvedValue({ docs }), logger: { warn } } } as unknown as PayloadRequest;
    return { req, warn };
  };

  it("chạm trần 500 bài thì ghi warn, vẫn làm mới cache", async () => {
    const { req, warn } = fakeRequest(500);
    const revalidate = vi.fn();
    const outcome = await expireOffers({ req, revalidate });
    expect(outcome.expired).toBe(500);
    expect(warn).toHaveBeenCalledOnce();
    expect(revalidate).toHaveBeenCalledOnce();
  });

  it("dưới trần thì không warn", async () => {
    const { req, warn } = fakeRequest(499);
    await expireOffers({ req, revalidate: vi.fn() });
    expect(warn).not.toHaveBeenCalled();
  });
});
