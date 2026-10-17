import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { Service } from "@/payload-types";

const findPublicServiceBySlug = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<Partial<Service> | null>>());
const findOtherServices = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<Partial<Service>[]>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/services/service-queries", () => ({ findPublicServiceBySlug, findOtherServices }));
vi.mock("@/lib/news/news-queries", () => ({ findLocalizedSlugs: async () => ({ vi: "moi-gioi", en: "brokerage" }) }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: vi } = await import("@/i18n/messages/vi.json");
  const { default: en } = await import("@/i18n/messages/en.json");
  const messages = { vi, en };
  return {
    setRequestLocale: () => undefined,
    getTranslations: async ({ locale, namespace }: { locale: "vi" | "en"; namespace: string }) =>
      createTranslator({ locale, messages: messages[locale], namespace: namespace as never }),
  };
});

import ServiceDetailPage, { generateMetadata } from "./page";

const paragraph = (value: string) => ({ type: "paragraph", children: [{ type: "text", text: value }] });
const service = (overrides: Partial<Service> = {}): Partial<Service> => ({
  id: "s1",
  title: "Môi giới",
  slug: "moi-gioi",
  summary: "Tư vấn mua bán",
  hasEnglish: false,
  coverImage: fakeMedia("moi-gioi") as never,
  content: { root: { type: "root", version: 1, children: [paragraph("Nội dung dịch vụ")] } } as never,
  ...overrides,
});
const other = (id: string, title: string, slug: string): Partial<Service> => service({ id, title, slug, summary: `Mô tả ${title}`, coverImage: fakeMedia(slug) as never });

async function renderService(locale: "vi" | "en" = "vi", slug = "moi-gioi") {
  const ui = await ServiceDetailPage({ params: Promise.resolve({ locale, slug }) });
  return renderWithIntl(ui, locale);
}

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example"));
afterEach(() => {
  vi.unstubAllEnvs();
  findPublicServiceBySlug.mockReset();
  findOtherServices.mockReset();
});

describe("trang Dịch vụ (S14)", () => {
  it("hero dùng coverImage + h1 tên dịch vụ; nội dung richText; 'Dịch vụ khác' có 2 thẻ là link; banner CTA → /lien-he?service=<slug>", async () => {
    findPublicServiceBySlug.mockResolvedValue(service());
    findOtherServices.mockResolvedValue([other("s2", "Phân phối", "phan-phoi"), other("s3", "Khai thác căn hộ", "khai-thac")]);
    const { container } = await renderService();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Môi giới" })).toBeInTheDocument();
    expect(container.querySelector('img[src*="moi-gioi"]')).not.toBeNull();
    expect(screen.getByText("Nội dung dịch vụ")).toBeInTheDocument();

    const others = screen.getByRole("heading", { level: 2, name: "Dịch vụ khác" }).closest("section") as HTMLElement;
    expect(within(others).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/dich-vu/phan-phoi", "/dich-vu/khai-thac"]);
    expect(within(others).getByRole("heading", { level: 3, name: "Phân phối" })).toBeInTheDocument();

    const cta = screen.getByRole("heading", { level: 2, name: "Bạn quan tâm Môi giới?" }).closest("section") as HTMLElement;
    expect(within(cta).getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "/lien-he?service=moi-gioi");
  });

  it("không có dịch vụ khác → ẩn khối; chưa có ảnh bìa → banner chữ (vẫn một h1)", async () => {
    findPublicServiceBySlug.mockResolvedValue(service({ coverImage: null }));
    findOtherServices.mockResolvedValue([]);
    const { container } = await renderService();
    expect(screen.queryByRole("heading", { name: "Dịch vụ khác" })).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("/en: nhãn và link CTA theo tiếng Anh, không lẫn tiếng Việt trong khung trang", async () => {
    findPublicServiceBySlug.mockResolvedValue(service({ title: "Brokerage", slug: "brokerage", summary: "Advice", hasEnglish: true }));
    findOtherServices.mockResolvedValue([other("s2", "Distribution", "distribution")]);
    renderWithIntl(await ServiceDetailPage({ params: Promise.resolve({ locale: "en", slug: "brokerage" }) }), "en");
    expect(screen.getByRole("heading", { level: 2, name: "Other services" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get advice" })).toHaveAttribute("href", "/en/contact?service=brokerage");
    expect(screen.getByRole("link", { name: /Distribution/ })).toHaveAttribute("href", "/en/services/distribution");
  });

  it("JSON-LD Service có inLanguage và không có image khi thiếu ảnh bìa", async () => {
    findPublicServiceBySlug.mockResolvedValue(service({ coverImage: null }));
    findOtherServices.mockResolvedValue([]);
    const { container } = await renderService();
    const data = [...container.querySelectorAll('script[type="application/ld+json"]')]
      .map((node) => JSON.parse(node.textContent ?? "null") as Record<string, unknown>)
      .find((item) => item["@type"] === "Service");
    expect(data).toMatchObject({ name: "Môi giới", url: "https://tami.example/dich-vu/moi-gioi", inLanguage: "vi" });
    expect(data).not.toHaveProperty("image");
  });

  it("không có / chưa công khai / chưa có EN → notFound (404)", async () => {
    findPublicServiceBySlug.mockResolvedValue(null);
    await expect(ServiceDetailPage({ params: Promise.resolve({ locale: "en", slug: "x" }) })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(await generateMetadata({ params: Promise.resolve({ locale: "en", slug: "x" }) })).toEqual({});
  });

  it("metadata: canonical theo ngôn ngữ; hreflang en chỉ khi dịch vụ có bản EN", async () => {
    findPublicServiceBySlug.mockResolvedValueOnce(service({ hasEnglish: false }));
    const noEn = await generateMetadata({ params: Promise.resolve({ locale: "vi", slug: "moi-gioi" }) });
    expect(noEn.alternates?.canonical).toBe("https://tami.example/dich-vu/moi-gioi");
    expect(noEn.alternates?.languages).toBeUndefined();
    findPublicServiceBySlug.mockResolvedValueOnce(service({ hasEnglish: true }));
    const withEn = await generateMetadata({ params: Promise.resolve({ locale: "vi", slug: "moi-gioi" }) });
    expect(withEn.alternates?.languages).toMatchObject({ en: "https://tami.example/en/services/brokerage" });
  });
});
