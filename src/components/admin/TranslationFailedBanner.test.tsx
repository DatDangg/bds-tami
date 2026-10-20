import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ role: "admin" as string }));
vi.mock("@payloadcms/ui", () => ({ useAuth: () => ({ user: { role: auth.role } }) }));

import { TranslationFailedBanner } from "./TranslationFailedBanner";

function stubFetch(lastError: string | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.startsWith("/api/rentals?")) return { ok: true, json: async () => ({ totalDocs: 2, docs: [{ translation: { lastError } }] }) };
      if (url.startsWith("/api/news?")) return { ok: true, json: async () => ({ totalDocs: 1, docs: [{ translation: { lastError } }] }) };
      return { ok: false, json: async () => ({}) };
    }),
  );
}

describe("TranslationFailedBanner", () => {
  beforeEach(() => {
    auth.role = "admin";
  });
  afterEach(() => vi.unstubAllGlobals());

  it("N > 0: cảnh báo nhẹ role=status, câu trấn an và link từng loại", async () => {
    stubFetch(null);
    render(<TranslationFailedBanner />);
    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("3 bài chưa dịch được sang tiếng Anh — bản tiếng Việt vẫn hiển thị bình thường.");
    expect(status.className).toContain("tami-admin-alert--warning");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("link", { name: /Cho thuê: 2 bài — xem danh sách/ }).getAttribute("href")).toContain("/admin/collections/rentals?where");
  });

  it("vượt hạn mức: câu riêng, vẫn trấn an", async () => {
    stubFetch("budget_exceeded");
    render(<TranslationFailedBanner />);
    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("Dịch tự động tạm dừng vì đã hết hạn mức tháng — bản tiếng Việt vẫn hiển thị bình thường.");
  });

  it("N = 0: không render", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ totalDocs: 0, docs: [] }) })));
    const { container } = render(<TranslationFailedBanner />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  it("sale: không render và không gọi API", () => {
    auth.role = "sale";
    stubFetch(null);
    const { container } = render(<TranslationFailedBanner />);
    expect(container.textContent).toBe("");
    expect(fetch).not.toHaveBeenCalled();
  });
});
