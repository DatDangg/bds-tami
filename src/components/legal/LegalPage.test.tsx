import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { Page } from "@/payload-types";

const loadLegalPage = vi.hoisted(() => vi.fn<(locale: string, kind: string) => Promise<Partial<Page> | null>>());
vi.mock("@/lib/legal/legal-page", () => ({ loadLegalPage }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: vi } = await import("@/i18n/messages/vi.json");
  const { default: en } = await import("@/i18n/messages/en.json");
  const messages = { vi, en };
  return {
    getTranslations: async ({ locale, namespace }: { locale: "vi" | "en"; namespace: string }) =>
      createTranslator({ locale, messages: messages[locale], namespace: namespace as never }),
  };
});

import { buildLegalMetadata, LegalPage } from "./LegalPage";

const text = (value: string) => ({ type: "text", version: 1, text: value });
const content = {
  root: {
    type: "root",
    version: 1,
    children: [
      { type: "heading", tag: "h2", children: [text("1. Phạm vi")] },
      { type: "paragraph", children: [text("Nội dung một.")] },
      { type: "heading", tag: "h2", children: [text("2. Mục đích")] },
      { type: "paragraph", children: [text("Nội dung hai.")] },
    ],
  },
} as unknown as Page["content"];

const page = (overrides: Partial<Page> = {}): Partial<Page> => ({
  kind: "privacy",
  title: "Chính sách bảo mật",
  version: "1.2",
  effectiveDate: "2026-03-05T05:00:00.000Z",
  hasEnglish: false,
  content,
  ...overrides,
});

afterEach(() => loadLegalPage.mockReset());

describe("trang pháp lý (S16)", () => {
  it("hiện phiên bản + ngày hiệu lực, một h1, mục lục trỏ đúng id h2", async () => {
    loadLegalPage.mockResolvedValue(page());
    const { container } = renderWithIntl(await LegalPage({ locale: "vi", kind: "privacy" }));
    expect(screen.getByRole("heading", { level: 1, name: "Chính sách bảo mật" })).toBeInTheDocument();
    expect(screen.getByText("Phiên bản 1.2 · Hiệu lực từ 05/03/2026")).toBeInTheDocument();
    const [accordion] = screen.getAllByRole("navigation", { name: "Mục lục" });
    const links = within(accordion as HTMLElement).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#muc-1", "#muc-2"]);
    for (const link of links) expect(container.querySelector(link.getAttribute("href") as string)).not.toBeNull();
    expect(container.querySelector("h2#muc-1")).toHaveTextContent("1. Phạm vi");
  });

  it("/en: nhãn tiếng Anh", async () => {
    loadLegalPage.mockResolvedValue(page({ title: "Privacy Policy", hasEnglish: true }));
    renderWithIntl(await LegalPage({ locale: "en", kind: "privacy" }), "en");
    expect(screen.getByText("Version 1.2 · Effective 03/05/2026")).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Contents" }).length).toBeGreaterThan(0);
  });

  it("EN chưa duyệt (không có bản công khai ở /en) → 404 EN, không render", async () => {
    loadLegalPage.mockResolvedValue(null);
    await expect(LegalPage({ locale: "en", kind: "privacy" })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(loadLegalPage).toHaveBeenCalledWith("en", "privacy");
  });

  it("không có heading → không có mục lục", async () => {
    loadLegalPage.mockResolvedValue(page({ content: { root: { type: "root", version: 1, children: [{ type: "paragraph", children: [text("x")] }] } } as unknown as Page["content"] }));
    renderWithIntl(await LegalPage({ locale: "vi", kind: "terms" }));
    expect(screen.queryByRole("navigation", { name: "Mục lục" })).toBeNull();
  });
});

describe("buildLegalMetadata", () => {
  it("hreflang en chỉ khi admin đã bật hasEnglish", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
    loadLegalPage.mockResolvedValueOnce(page({ hasEnglish: false }));
    expect((await buildLegalMetadata("vi", "privacy")).alternates?.languages).toBeUndefined();
    loadLegalPage.mockResolvedValueOnce(page({ hasEnglish: true }));
    const meta = await buildLegalMetadata("vi", "terms");
    expect(meta.alternates?.canonical).toBe("https://tami.example/dieu-khoan-su-dung");
    expect(meta.alternates?.languages).toMatchObject({ vi: "https://tami.example/dieu-khoan-su-dung", en: "https://tami.example/en/terms-of-use" });
    vi.unstubAllEnvs();
  });

  it("không có trang → metadata rỗng", async () => {
    loadLegalPage.mockResolvedValueOnce(null);
    expect(await buildLegalMetadata("en", "privacy")).toEqual({});
  });
});
