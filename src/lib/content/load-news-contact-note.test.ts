import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const getSiteSettings = vi.hoisted(() => vi.fn());
const warn = vi.hoisted(() => vi.fn());
vi.mock("./get-globals", () => ({ getSiteSettings }));
vi.mock("../logger", () => ({ logger: { warn } }));

import { loadNewsContactNote } from "./load-news-contact-note";

beforeEach(() => vi.clearAllMocks());

describe("loadNewsContactNote (BL-062)", () => {
  it("trả chữ admin đã cắt khoảng trắng cho đúng ngôn ngữ đang xem", async () => {
    getSiteSettings.mockResolvedValue({ newsDetail: { contactNote: "  Liên hệ TAMI REAL ESTATE  " } });
    await expect(loadNewsContactNote("en")).resolves.toBe("Liên hệ TAMI REAL ESTATE");
    expect(getSiteSettings).toHaveBeenCalledWith("en");
  });

  it.each([[{ newsDetail: { contactNote: "   " } }], [{ newsDetail: { contactNote: null } }], [{ newsDetail: {} }], [{}]])("rỗng / thiếu (%j) → undefined để trang dùng câu mặc định", async (settings) => {
    getSiteSettings.mockResolvedValue(settings);
    await expect(loadNewsContactNote("vi")).resolves.toBeUndefined();
  });

  it("global lỗi (DB tắt lúc build) → undefined + cảnh báo, không làm hỏng trang", async () => {
    getSiteSettings.mockRejectedValue(new Error("db down"));
    await expect(loadNewsContactNote("vi")).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
