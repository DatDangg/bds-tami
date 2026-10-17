import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/components/layout/cookie-settings-event";
import { renderWithIntl } from "@/components/media/test-utils";
import { CONSENT_COOKIE, readConsent, writeConsent } from "@/lib/consent/consent-cookie";
import { CookieBanner } from "./CookieBanner";

vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), usePathname: () => "/" }));

const GA_ID = "G-TEST1234";
const OFFSET_VAR = "--floating-bottom-offset";
const gtagScript = () => document.getElementById("tami-gtag") as HTMLScriptElement | null;
const hasGaCookie = () => document.cookie.split("; ").some((part) => part.startsWith("_ga"));
const offsetValue = () => document.documentElement.style.getPropertyValue(OFFSET_VAR);
const openSettings = () => act(() => void window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT)));

function clearAllCookies() {
  for (const part of document.cookie.split("; ")) {
    const name = part.split("=")[0];
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
}

function mockMatchMedia(matchesMd: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: matchesMd, addEventListener: () => {}, removeEventListener: () => {} }),
  });
}

function renderBanner(
  overrides: Partial<{ gaMeasurementId: string | null; privacyPolicyVersion: string }> = {},
  locale: "vi" | "en" = "vi",
) {
  return renderWithIntl(<CookieBanner gaMeasurementId={GA_ID} privacyPolicyVersion="1" {...overrides} />, locale);
}

beforeEach(() => mockMatchMedia(false));
afterEach(() => {
  clearAllCookies();
  gtagScript()?.remove();
  document.documentElement.style.removeProperty(OFFSET_VAR);
  delete (window as { dataLayer?: unknown }).dataLayer;
  delete (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`];
});

describe("CookieBanner", () => {
  it("lần đầu: hiện banner, chưa có script gtag, chưa có cookie _ga", async () => {
    renderBanner();
    expect(await screen.findByRole("region", { name: "Cookie" })).toBeInTheDocument();
    expect(gtagScript()).toBeNull();
    expect(hasGaCookie()).toBe(false);
  });

  it("từ chối: lưu analytics=false, banner đóng, không chèn script", async () => {
    const user = userEvent.setup();
    renderBanner();
    await user.click(await screen.findByRole("button", { name: "Từ chối" }));
    expect(screen.queryByRole("region", { name: "Cookie" })).toBeNull();
    expect(gtagScript()).toBeNull();
    expect(hasGaCookie()).toBe(false);
    expect(readConsent()).toMatchObject({ analytics: false, pv: "1" });
  });

  it("đồng ý: chèn gtag đúng measurement ID", async () => {
    const user = userEvent.setup();
    renderBanner();
    await user.click(await screen.findByRole("button", { name: "Đồng ý" }));
    expect(gtagScript()?.src).toBe(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
    expect(readConsent()).toMatchObject({ analytics: true });
  });

  it("Từ chối và Đồng ý ngang hàng: cùng cỡ, cao 44px (h-11)", async () => {
    renderBanner();
    const decline = await screen.findByRole("button", { name: "Từ chối" });
    const accept = screen.getByRole("button", { name: "Đồng ý" });
    expect(decline.className).toContain("flex-1");
    expect(accept.className).toContain("flex-1");
    expect(decline.dataset.size).toBe(accept.dataset.size);
    expect(decline.className).toContain("h-11");
  });

  it("đã đồng ý trước đó (cùng phiên bản chính sách): không hiện banner, tải gtag", async () => {
    writeConsent(true, "1");
    renderBanner();
    await act(async () => {});
    expect(screen.queryByRole("region", { name: "Cookie" })).toBeNull();
    expect(gtagScript()).not.toBeNull();
  });

  it("đổi privacyPolicyVersion → hỏi lại và không tải gtag", async () => {
    writeConsent(true, "1");
    renderBanner({ privacyPolicyVersion: "2" });
    expect(await screen.findByRole("region", { name: "Cookie" })).toBeInTheDocument();
    expect(gtagScript()).toBeNull();
  });

  it("cookie tami_consent hỏng → coi như chưa chọn", async () => {
    document.cookie = `${CONSENT_COOKIE}=%7Bhong; Path=/`;
    renderBanner();
    expect(await screen.findByRole("region", { name: "Cookie" })).toBeInTheDocument();
    expect(gtagScript()).toBeNull();
  });

  it.each([null, "", "UA-1"])("gaMeasurementId=%j → không banner, không script", async (gaMeasurementId) => {
    const { container } = renderBanner({ gaMeasurementId });
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("region", { name: "Cookie" })).toBeNull();
    expect(gtagScript()).toBeNull();
  });

  it("render server (trước khi đọc cookie) không đổi theo cookie", async () => {
    const { renderToString } = await import("react-dom/server");
    const { NextIntlClientProvider } = await import("next-intl");
    const vi_ = (await import("@/i18n/messages/vi.json")).default;
    const html = () =>
      renderToString(
        <NextIntlClientProvider locale="vi" messages={vi_}>
          <CookieBanner gaMeasurementId={GA_ID} privacyPolicyVersion="1" />
        </NextIntlClientProvider>,
      );
    const withoutCookie = html();
    writeConsent(true, "1");
    expect(html()).toBe(withoutCookie);
    expect(withoutCookie).not.toContain("<section");
  });

  it("hydrate với cookie đã đồng ý: giữ nguyên _ga (không bị xoá ở render đầu) và chèn gtag", async () => {
    const { renderToString } = await import("react-dom/server");
    const { hydrateRoot } = await import("react-dom/client");
    const { NextIntlClientProvider } = await import("next-intl");
    const vi_ = (await import("@/i18n/messages/vi.json")).default;
    const tree = (
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <CookieBanner gaMeasurementId={GA_ID} privacyPolicyVersion="1" />
      </NextIntlClientProvider>
    );
    const serverHtml = renderToString(tree);
    writeConsent(true, "1");
    document.cookie = "_ga=GA1.1.111.222; Path=/";
    document.cookie = `_ga_TEST1234=GS1.1.1; Path=/`;
    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.appendChild(container);
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, tree);
    });
    expect(document.cookie).toContain("_ga=GA1.1.111.222");
    expect(document.cookie).toContain("_ga_TEST1234=GS1.1.1");
    expect(gtagScript()).not.toBeNull();
    expect((window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`]).toBe(false);
    act(() => root.unmount());
    container.remove();
  });

  it("banner có link chính sách bảo mật; /en không có chữ tiếng Việt", async () => {
    renderBanner({}, "en");
    const region = await screen.findByRole("region", { name: "Cookie" });
    expect(within(region).getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/en/privacy-policy");
    expect(within(region).getByRole("button", { name: "Decline" })).toBeInTheDocument();
    expect(region.textContent).not.toMatch(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i);
  });

  it("dưới md: đặt --floating-bottom-offset khi banner hiện, gỡ khi đóng", async () => {
    const user = userEvent.setup();
    renderBanner();
    const decline = await screen.findByRole("button", { name: "Từ chối" });
    expect(offsetValue()).toMatch(/^\d+px$/);
    await user.click(decline);
    expect(offsetValue()).toBe("");
  });

  it("từ md: không đặt --floating-bottom-offset (banner ở góc trái)", async () => {
    mockMatchMedia(true);
    renderBanner();
    await screen.findByRole("region", { name: "Cookie" });
    expect(offsetValue()).toBe("");
  });
});

describe("Cài đặt cookie / rút lại đồng ý", () => {
  it("sự kiện từ footer mở dialog modal; tắt Phân tích + Lưu → xoá _ga*, ghi analytics=false", async () => {
    const user = userEvent.setup();
    writeConsent(true, "1");
    document.cookie = "_ga=GA1.1.1; Path=/";
    document.cookie = "_ga_TEST1234=GS1; Path=/";
    renderBanner();
    await act(async () => {});
    expect(gtagScript()).not.toBeNull();

    openSettings();
    const dialog = await screen.findByRole("dialog", { name: "Tuỳ chọn cookie" });
    expect(within(dialog).getByRole("switch", { name: "Cần thiết" })).toBeDisabled();
    const analytics = within(dialog).getByRole("switch", { name: "Phân tích" });
    expect(analytics).toBeChecked();
    await user.click(analytics);
    await user.click(within(dialog).getByRole("button", { name: "Lưu lựa chọn" }));

    expect(readConsent()).toMatchObject({ analytics: false });
    expect(hasGaCookie()).toBe(false);
    expect((window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`]).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("lưu dialog mở từ banner (nút Tuỳ chọn biến mất): focus chuyển về main#main", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <>
        <main id="main" tabIndex={-1} />
        <CookieBanner gaMeasurementId={GA_ID} privacyPolicyVersion="1" />
      </>,
    );
    await user.click(await screen.findByRole("button", { name: "Tuỳ chọn" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Lưu lựa chọn" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.getElementById("main")).toHaveFocus();
  });

  it("dialog mở từ nút footer: đóng xong focus về chính nút đó", async () => {
    const user = userEvent.setup();
    writeConsent(true, "1");
    renderWithIntl(
      <>
        <button type="button">Cài đặt cookie</button>
        <CookieBanner gaMeasurementId={GA_ID} privacyPolicyVersion="1" />
      </>,
    );
    await act(async () => {});
    const opener = screen.getByRole("button", { name: "Cài đặt cookie" });
    opener.focus();
    openSettings();
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });

  it("Esc đóng dialog mà không lưu thay đổi", async () => {
    const user = userEvent.setup();
    writeConsent(true, "1");
    renderBanner();
    await act(async () => {});
    openSettings();
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("switch", { name: "Phân tích" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(readConsent()).toMatchObject({ analytics: true });
  });

  it("không có GA ID: sự kiện footer không mở gì", async () => {
    renderBanner({ gaMeasurementId: null });
    openSettings();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
