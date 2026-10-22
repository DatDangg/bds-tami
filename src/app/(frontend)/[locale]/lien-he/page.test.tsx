import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { SiteSetting } from "@/payload-types";

const getSiteSettings = vi.hoisted(() => vi.fn<(locale: string) => Promise<Partial<SiteSetting>>>());
vi.mock("@/lib/content/get-globals", () => ({ getSiteSettings }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-page-banner", () => ({
  loadPageHero: async (locale: string) => ({ title: locale === "en" ? "Contact" : "Liên hệ", eyebrow: locale === "en" ? "Contact" : "Liên hệ" }),
}));
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

import ContactPage from "./page";

const settings: Partial<SiteSetting> = {
  siteName: "TAMI",
  hotline: "0900 123 456",
  email: "lienhe@tami.example",
  address: "1 Lê Lợi, Quận 1",
  socialLinks: [{ platform: "facebook", url: "https://facebook.com/tami" }],
};

async function renderContact(locale: "vi" | "en") {
  const ui = await ContactPage({ params: Promise.resolve({ locale }) });
  return renderWithIntl(ui, locale);
}

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example"));
afterEach(() => {
  vi.unstubAllEnvs();
  getSiteSettings.mockReset();
});

describe("trang Liên hệ (S15, BL-054)", () => {
  it("chưa có offices → 1 văn phòng từ trường cũ; thẻ Hotline/Email gọi được; thiếu workingHours/Zalo → ẩn 2 thẻ đó; form + không banner tư vấn", async () => {
    getSiteSettings.mockResolvedValue(settings);
    const { container } = await renderContact("vi");
    const cards = screen.getByRole("list", { name: "Kênh liên hệ" });
    expect(within(cards).getAllByRole("listitem")).toHaveLength(2);
    expect(within(cards).getByRole("link", { name: "Gọi ngay 0900 123 456" })).toHaveAttribute("href", "tel:0900123456");
    expect(within(cards).getByRole("link", { name: "Gửi email tới lienhe@tami.example" })).toHaveAttribute("href", "mailto:lienhe@tami.example");
    expect(screen.queryByText("Giờ làm việc")).toBeNull();
    expect(screen.queryByText("Zalo OA")).toBeNull();
    const offices = screen.getByRole("region", { name: "Hệ thống văn phòng" });
    expect(within(offices).getByRole("heading", { level: 3, name: "Văn phòng TAMI" })).toBeInTheDocument();
    expect(within(offices).getByText("1 Lê Lợi, Quận 1")).toBeInTheDocument();
    expect(within(offices).queryByRole("tablist")).toBeNull();
    expect(within(offices).queryByRole("region", { name: "Văn phòng TAMI trên bản đồ" })).toBeNull();
    const slot = document.getElementById("lead-form");
    expect(slot).toHaveAccessibleName("Bạn cần TAMI hỗ trợ điều gì?");
    expect(slot).toHaveClass("bg-surface", "shadow-md");
    expect(within(slot!).getByRole("button", { name: "Gửi yêu cầu" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("section[data-hero-size=short]")).not.toBeNull();
    expect(container.querySelector("[data-testid=consult-banner]")).toBeNull();
    expect(screen.getByRole("link", { name: "Xem vị trí đang tuyển" })).toHaveAttribute("href", "/tuyen-dung");
  });

  it("đủ workingHours + Zalo → 4 thẻ; Zalo hiện siteName, mở tab mới an toàn", async () => {
    getSiteSettings.mockResolvedValue({ ...settings, zaloUrl: "https://zalo.me/123", workingHours: { hours: "8:00 – 18:00", days: "Thứ 2 – Chủ nhật" } });
    await renderContact("vi");
    const cards = screen.getByRole("list", { name: "Kênh liên hệ" });
    expect(within(cards).getAllByRole("listitem")).toHaveLength(4);
    expect(cards).toHaveClass("lg:grid-cols-4");
    const zalo = within(cards).getByRole("link", { name: "Nhắn tin Zalo OA TAMI (mở tab mới)" });
    expect(zalo).toHaveAttribute("href", "https://zalo.me/123");
    expect(zalo).toHaveAttribute("target", "_blank");
    expect(zalo).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(cards).getByText("8:00 – 18:00")).toBeInTheDocument();
    expect(within(cards).getByText("Thứ 2 – Chủ nhật")).toBeInTheDocument();
  });

  it("có mapLocation ([kinh độ, vĩ độ]) → bản đồ lười của văn phòng dự phòng + nút Chỉ đường theo toạ độ", async () => {
    getSiteSettings.mockResolvedValue({ ...settings, mapLocation: [106.7, 10.78] });
    await renderContact("vi");
    expect(screen.getByRole("region", { name: "Văn phòng TAMI trên bản đồ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem bản đồ" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mở Google Maps" })).toBeNull();
    expect(screen.getByRole("link", { name: "Chỉ đường tới Văn phòng TAMI trên Google Maps (mở tab mới)" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=10.78%2C106.7",
    );
  });

  it("≥ 2 văn phòng → tab chi nhánh; văn phòng đầu đang chọn", async () => {
    getSiteSettings.mockResolvedValue({
      ...settings,
      offices: [
        { id: "hn", name: "Hà Nội", address: "Tây Hồ, Hà Nội", location: [105.81, 21.07] },
        { id: "hcm", name: "TP.HCM", address: "Quận 1, TP.HCM" },
      ],
    });
    await renderContact("vi");
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Hà Nội", "TP.HCM"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Tây Hồ, Hà Nội");
  });

  it("settings đọc lỗi (DB tắt) → trang vẫn dựng, không thẻ / văn phòng; form vẫn có", async () => {
    getSiteSettings.mockRejectedValue(new Error("db down"));
    await renderContact("vi");
    expect(screen.getByRole("heading", { level: 1, name: "Liên hệ" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Kênh liên hệ" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Hệ thống văn phòng" })).toBeNull();
    expect(document.getElementById("lead-form")).not.toBeNull();
  });

  it("/en không lẫn tiếng Việt; hàng offices thiếu EN bị bỏ → văn phòng dự phòng EN; nút tuyển dụng → /en/careers", async () => {
    getSiteSettings.mockResolvedValue({ ...settings, address: "1 Le Loi Street", mapLocation: [106.7, 10.78], offices: [{ id: "hn", name: null as unknown as string, address: null as unknown as string }] });
    const { container } = await renderContact("en");
    expect(screen.getByRole("heading", { level: 1, name: "Contact" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "TAMI office" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "TAMI office on the map" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View open positions" })).toHaveAttribute("href", "/en/careers");
    expect(container.textContent).not.toMatch(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i);
  });

  it("JSON-LD Organization có thông tin liên hệ + sameAs, escape `<`", async () => {
    getSiteSettings.mockResolvedValue({ ...settings, address: "Số 1 </script><b>" });
    const { container } = await renderContact("vi");
    const scripts = [...container.querySelectorAll('script[type="application/ld+json"]')];
    const org = scripts.map((node) => JSON.parse(node.textContent ?? "null") as Record<string, unknown>).find((data) => data["@type"] === "Organization");
    expect(org).toMatchObject({ name: "TAMI", telephone: "0900 123 456", email: "lienhe@tami.example", sameAs: ["https://facebook.com/tami"] });
    expect(scripts.every((node) => !node.textContent?.includes("<"))).toBe(true);
  });
});
