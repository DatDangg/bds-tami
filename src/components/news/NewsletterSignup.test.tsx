import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { NewsletterSignup } from "./NewsletterSignup";

// Widget Turnstile có test riêng: ở đây giả lập đã xác minh xong ngay.
vi.mock("@/components/forms/TurnstileWidget", async () => {
  const { useEffect } = await import("react");
  return {
    TurnstileWidget: ({ onToken }: { onToken: (token: string | null) => void }) => {
      useEffect(() => onToken("tok-1"), [onToken]);
      return null;
    },
  };
});

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fill(user: ReturnType<typeof userEvent.setup>, email: string, consent = true) {
  await user.type(screen.getByLabelText(/^Email/), email);
  if (consent) await user.click(screen.getByRole("checkbox"));
}

beforeEach(() => {
  window.history.replaceState(null, "", "/tin-tuc?page=2#top");
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("NewsletterSignup", () => {
  it("vùng có tên theo tiêu đề; câu đồng ý nêu mục đích bản tin + link chính sách theo locale; dòng cam kết", () => {
    renderWithIntl(<NewsletterSignup turnstileSiteKey="site" />, "vi");
    expect(screen.getByRole("region", { name: "Nhận tin tức bất động sản mới nhất mỗi tuần" })).toBeTruthy();
    expect(screen.getByText("Bản tin thị trường")).toBeTruthy();
    const checkbox = screen.getByRole("checkbox", { name: /Tôi đồng ý nhận bản tin qua email/ });
    expect(checkbox.getAttribute("aria-required")).toBe("true");
    expect(screen.getByRole("link", { name: /Chính sách bảo mật/ }).getAttribute("href")).toBe("/chinh-sach-bao-mat");
    expect(screen.getByText("Chúng tôi cam kết không chia sẻ email của bạn.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Đăng ký" })).toBeTruthy();
  });

  it("gửi thành công: JSON đúng (email, consent, locale, token, sourcePath không query/hash) -> panel role=status thay form", async () => {
    const fetchMock = stubFetch(jsonResponse(200, { success: true, data: { received: true } }));
    const user = userEvent.setup();
    renderWithIntl(<NewsletterSignup turnstileSiteKey="site" />, "vi");
    await fill(user, "khach@example.test");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/public/newsletter");
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body as string)).toEqual({
      email: "khach@example.test",
      consent: true,
      locale: "vi",
      turnstileToken: "tok-1",
      sourcePath: "/tin-tuc",
    });
    expect(screen.getByRole("heading", { name: "Đăng ký thành công!" })).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("email sai / chưa đồng ý -> lỗi tại ô (aria-invalid), không gửi", async () => {
    const fetchMock = stubFetch(jsonResponse(200, {}));
    const user = userEvent.setup();
    renderWithIntl(<NewsletterSignup turnstileSiteKey="site" />, "vi");
    await fill(user, "khong-phai-email", false);
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));
    expect(await screen.findByText("Email chưa hợp lệ.")).toBeTruthy();
    expect(screen.getByLabelText(/^Email/).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("checkbox").getAttribute("aria-invalid")).toBe("true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("server 429 -> cảnh báo role=alert (EN), form còn nguyên để thử lại sau", async () => {
    stubFetch(jsonResponse(429, { success: false, error: "Too many submissions, please try again later" }, { "Retry-After": "300" }));
    const user = userEvent.setup();
    renderWithIntl(<NewsletterSignup turnstileSiteKey="site" />, "en");
    expect(screen.getByRole("region", { name: "Get the latest real estate news every week" })).toBeTruthy();
    await fill(user, "guest@example.test");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/5 minutes/);
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeTruthy();
  });

  it("server 400 details email -> lỗi gắn vào ô email", async () => {
    stubFetch(jsonResponse(400, { success: false, error: "Dữ liệu không hợp lệ", details: [{ field: "email", message: "Giá trị không hợp lệ" }] }));
    const user = userEvent.setup();
    renderWithIntl(<NewsletterSignup turnstileSiteKey="site" />, "vi");
    await fill(user, "khach@example.test");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));
    expect(await screen.findByText("Giá trị không hợp lệ")).toBeTruthy();
    expect(screen.getByLabelText(/^Email/).getAttribute("aria-invalid")).toBe("true");
  });
});
