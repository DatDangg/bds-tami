import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { SiteSetting } from "@/payload-types";

const getSiteSettings = vi.hoisted(() => vi.fn<(locale: string) => Promise<Partial<SiteSetting>>>());
vi.mock("@/lib/content/get-globals", () => ({ getSiteSettings }));
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

describe("trang Liên hệ (S15)", () => {
  it("chưa có mapLocation → ẩn cả khối bản đồ; vẫn có hotline gọi được, email, địa chỉ, giờ làm việc và vùng form", async () => {
    getSiteSettings.mockResolvedValue(settings);
    await renderContact("vi");
    expect(screen.queryByRole("region", { name: "Văn phòng TAMI trên bản đồ" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Xem bản đồ" })).toBeNull();
    expect(screen.getByRole("link", { name: "Hotline: 0900 123 456" })).toHaveAttribute("href", "tel:0900123456");
    expect(screen.getByRole("link", { name: "lienhe@tami.example" })).toHaveAttribute("href", "mailto:lienhe@tami.example");
    expect(screen.getByText("1 Lê Lợi, Quận 1")).toBeInTheDocument();
    expect(screen.getByText("08:00 - 17:30, thứ 2 - thứ 7")).toBeInTheDocument();
    const slot = document.getElementById("lead-form");
    expect(slot).toHaveAccessibleName("Gửi yêu cầu tư vấn");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("có mapLocation ([kinh độ, vĩ độ]) → bản đồ lười có nhãn, chưa tải cho tới khi vào viewport/bấm", async () => {
    getSiteSettings.mockResolvedValue({ ...settings, mapLocation: [106.7, 10.78] });
    await renderContact("vi");
    expect(screen.getByRole("region", { name: "Văn phòng TAMI trên bản đồ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem bản đồ" })).toBeInTheDocument();
  });

  it("settings đọc lỗi (DB tắt) → trang vẫn dựng, không có hotline/bản đồ", async () => {
    getSiteSettings.mockRejectedValue(new Error("db down"));
    await renderContact("vi");
    expect(screen.getByRole("heading", { level: 1, name: "Liên hệ" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Hotline/ })).toBeNull();
    expect(screen.queryByRole("region", { name: "Văn phòng TAMI trên bản đồ" })).toBeNull();
  });

  it("/en không lẫn tiếng Việt; giờ làm việc theo i18n", async () => {
    getSiteSettings.mockResolvedValue({ ...settings, address: "1 Le Loi Street", mapLocation: [106.7, 10.78] });
    const { container } = await renderContact("en");
    expect(screen.getByRole("heading", { level: 1, name: "Contact" })).toBeInTheDocument();
    expect(screen.getByText("8:00 AM - 5:30 PM, Mon - Sat")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "TAMI office on the map" })).toBeInTheDocument();
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
