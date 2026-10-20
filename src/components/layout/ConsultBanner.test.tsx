import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
const getHomepage = vi.fn();
vi.mock("@/lib/content/get-globals", () => ({ getHomepage: (...args: unknown[]) => getHomepage(...args) }));
vi.mock("next-intl/server", async () => {
  const [{ createTranslator }, vi_, en_] = await Promise.all([import("next-intl"), import("@/i18n/messages/vi.json"), import("@/i18n/messages/en.json")]);
  const messages = { vi: vi_.default, en: en_.default };
  return { getTranslations: async ({ locale, namespace }: { locale: "vi" | "en"; namespace: string }) => createTranslator({ locale, messages: messages[locale], namespace: namespace as never }) };
});

const { ConsultBanner } = await import("./ConsultBanner");

beforeEach(() => {
  getHomepage.mockReset();
});

describe("ConsultBanner", () => {
  it("dùng chữ + nút CMS của homepage.ctaBanner kể cả khi khối trang chủ tắt (enabled=false)", async () => {
    getHomepage.mockResolvedValue({ ctaBanner: { enabled: false, title: "Tư vấn riêng", description: "Mô tả CMS", ctaLabel: "Gọi ngay", ctaLink: "careers" } });
    renderWithIntl(await ConsultBanner({ locale: "vi" }));
    expect(screen.getByRole("heading", { level: 2, name: "Tư vấn riêng" })).toBeInTheDocument();
    expect(screen.getByText("Mô tả CMS")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gọi ngay" })).toHaveAttribute("href", "/tuyen-dung");
  });

  it("chữ trống → i18n mặc định vi; /en không rơi về tiếng Việt", async () => {
    getHomepage.mockResolvedValue({ ctaBanner: { title: "" } });
    const vi_ = renderWithIntl(await ConsultBanner({ locale: "vi" }));
    expect(screen.getByRole("heading", { level: 2, name: "Cần tư vấn bất động sản?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "/lien-he");
    vi_.unmount();
    renderWithIntl(await ConsultBanner({ locale: "en" }), "en");
    expect(screen.getByRole("heading", { level: 2, name: "Need real estate advice?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get advice" })).toHaveAttribute("href", "/en/contact");
  });

  it("tiêu đề + mô tả đi theo cặp: admin có tiêu đề, không có mô tả → KHÔNG chèn mô tả mặc định (hành vi chủ đích)", async () => {
    getHomepage.mockResolvedValue({ ctaBanner: { title: "Tư vấn riêng", description: "" } });
    renderWithIntl(await ConsultBanner({ locale: "vi" }));
    expect(screen.getByRole("heading", { level: 2, name: "Tư vấn riêng" })).toBeInTheDocument();
    expect(screen.queryByText("Để lại thông tin, chúng tôi liên hệ trong thời gian sớm nhất.")).toBeNull();
  });

  it("tiêu đề trống nhưng có mô tả CMS → dùng cả tiêu đề lẫn mô tả mặc định (không trộn chữ admin)", async () => {
    getHomepage.mockResolvedValue({ ctaBanner: { title: "", description: "Mô tả lẻ của admin" } });
    renderWithIntl(await ConsultBanner({ locale: "vi" }));
    expect(screen.getByRole("heading", { level: 2, name: "Cần tư vấn bất động sản?" })).toBeInTheDocument();
    expect(screen.queryByText("Mô tả lẻ của admin")).toBeNull();
    expect(screen.getByText("Để lại thông tin, chúng tôi liên hệ trong thời gian sớm nhất.")).toBeInTheDocument();
  });

  it("actionHref ghi đè đích nút (chi tiết dự án → #lead-form); thiếu ảnh → khối tối, không scrim", async () => {
    getHomepage.mockResolvedValue({ ctaBanner: { title: "X" } });
    const { container } = renderWithIntl(await ConsultBanner({ locale: "vi", actionHref: "#lead-form" }));
    expect(screen.getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "#lead-form");
    expect(container.querySelector("section")).toHaveClass("theme-dark-block");
    expect(container.querySelector("[data-testid=cta-scrim]")).toBeNull();
  });

  it("homepage lỗi → vẫn hiện bản mặc định, không ném", async () => {
    getHomepage.mockImplementation(async () => {
      throw new Error("db down");
    });
    renderWithIntl(await ConsultBanner({ locale: "vi" }));
    expect(screen.getByRole("heading", { level: 2, name: "Cần tư vấn bất động sản?" })).toBeInTheDocument();
  });

  it("secondary (vd tel: hotline) truyền vào thắng nút phụ CMS; không truyền thì giữ nút phụ CMS", async () => {
    getHomepage.mockResolvedValue({ ctaBanner: { title: "X", secondaryLabel: "Nút CMS", secondaryLink: "careers" } });
    const withProp = renderWithIntl(await ConsultBanner({ locale: "vi", secondary: { label: "Gọi hotline: 0901 234 567", href: "tel:0901234567" } }));
    expect(screen.getByRole("link", { name: "Gọi hotline: 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    expect(screen.queryByRole("link", { name: "Nút CMS" })).toBeNull();
    withProp.unmount();
    renderWithIntl(await ConsultBanner({ locale: "vi" }));
    expect(screen.getByRole("link", { name: "Nút CMS" })).toBeInTheDocument();
  });
});
