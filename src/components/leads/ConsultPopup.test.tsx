import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { renderWithIntl } from "@/components/media/test-utils";
import vi_messages from "@/i18n/messages/vi.json";
import { CONSULT_POPUP_SHOWN_KEY, CONSULT_POPUP_STARTED_KEY, ConsultPopup, POPUP_DELAY_MS } from "./ConsultPopup";

const nav = vi.hoisted(() => ({ pathname: "/du-an" }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), usePathname: () => nav.pathname }));

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

const RECHECK_MS = 250;
const NOW = new Date("2026-10-23T03:00:00.000Z");

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** `rerender` của RTL thay cả cây: phải bọc lại provider i18n. */
const inVi = (ui: ReactElement) => <NextIntlClientProvider locale="vi" messages={vi_messages}>{ui}</NextIntlClientProvider>;

/** Phần tử test tự gắn vào body (ngoài cây React) — dọn sau mỗi test. */
const outsideNodes: HTMLElement[] = [];

const dialog = () => screen.queryByRole("dialog");

/** Phiên đã bắt đầu từ lâu: popup mở ngay khi mount (dùng cho test cần `userEvent` với timer thật). */
function startSessionLongAgo() {
  window.sessionStorage.setItem(CONSULT_POPUP_STARTED_KEY, String(Date.now() - POPUP_DELAY_MS - 1));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
  vi.setSystemTime(NOW);
  window.sessionStorage.clear();
  nav.pathname = "/du-an";
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const node of outsideNodes.splice(0)) node.remove();
});

describe("ConsultPopup: mốc 30 giây theo phiên", () => {
  it("chưa hiện trước 30s, hiện đúng tại 30s với tiêu đề làm nhãn và form", () => {
    renderWithIntl(<ConsultPopup />);
    advance(POPUP_DELAY_MS - 1);
    expect(dialog()).toBeNull();
    advance(1);
    expect(screen.getByRole("dialog", { name: "Nhận tư vấn miễn phí" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Họ và tên/)).toBeInTheDocument();
    expect(window.sessionStorage.getItem(CONSULT_POPUP_SHOWN_KEY)).toBe("1");
  });

  it("chuyển trang (mount lại) không reset đồng hồ: trang mới chỉ chờ phần còn lại", () => {
    const first = renderWithIntl(<ConsultPopup />);
    advance(12_000);
    first.unmount();
    nav.pathname = "/cho-thue";
    renderWithIntl(<ConsultPopup />);
    advance(POPUP_DELAY_MS - 12_000 - 1);
    expect(dialog()).toBeNull();
    advance(1);
    expect(dialog()).not.toBeNull();
  });

  it("đổi pathname trong cùng lần mount (điều hướng phía client) cũng không reset đồng hồ", () => {
    const view = renderWithIntl(<ConsultPopup />);
    advance(20_000);
    nav.pathname = "/tin-tuc";
    view.rerender(inVi(<ConsultPopup />));
    advance(POPUP_DELAY_MS - 20_000 - 1);
    expect(dialog()).toBeNull();
    advance(1);
    expect(dialog()).not.toBeNull();
  });

  it("đã hiện thì không hiện lại trong phiên (sau khi đóng và đổi trang)", async () => {
    vi.useRealTimers();
    startSessionLongAgo();
    const user = userEvent.setup();
    const first = renderWithIntl(<ConsultPopup />);
    await user.click(await screen.findByRole("button", { name: "Đóng" }));
    expect(dialog()).toBeNull();
    first.unmount();
    nav.pathname = "/cho-thue";
    renderWithIntl(<ConsultPopup />);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(dialog()).toBeNull();
  });

  it("cờ shown có sẵn thì không bao giờ hiện; phiên mới (storage trống) lại đếm từ đầu", () => {
    window.sessionStorage.setItem(CONSULT_POPUP_SHOWN_KEY, "1");
    const first = renderWithIntl(<ConsultPopup />);
    advance(POPUP_DELAY_MS * 2);
    expect(dialog()).toBeNull();
    first.unmount();
    window.sessionStorage.clear();
    renderWithIntl(<ConsultPopup />);
    advance(POPUP_DELAY_MS);
    expect(dialog()).not.toBeNull();
  });
});

describe("ConsultPopup: trang Liên hệ", () => {
  it.each(["/lien-he", "/lien-he/", "/en/contact"])("không hiện ở %s và không đánh dấu shown", (pathname) => {
    nav.pathname = pathname;
    renderWithIntl(<ConsultPopup />);
    advance(POPUP_DELAY_MS * 2);
    expect(dialog()).toBeNull();
    expect(window.sessionStorage.getItem(CONSULT_POPUP_SHOWN_KEY)).toBeNull();
  });

  it("quá mốc khi đang ở /lien-he thì chưa hiện; sang trang khác thì hiện ngay", () => {
    nav.pathname = "/lien-he";
    const view = renderWithIntl(<ConsultPopup />);
    advance(POPUP_DELAY_MS + 5_000);
    expect(dialog()).toBeNull();
    nav.pathname = "/du-an";
    view.rerender(inVi(<ConsultPopup />));
    advance(0);
    expect(dialog()).not.toBeNull();
  });
});

describe("ConsultPopup: hoãn khi đang nhập form khác hoặc có modal khác", () => {
  /** Form ngoài gồm ô nhập + nút gửi; `outside` là nút ngoài form để chuyển focus ra hẳn. */
  function mountOtherForm() {
    const form = document.createElement("form");
    const input = document.createElement("input");
    input.setAttribute("aria-label", "Ô ngoài");
    const submit = document.createElement("button");
    submit.type = "button";
    submit.textContent = "Gửi";
    form.append(input, submit);
    const outside = document.createElement("button");
    outside.textContent = "Ngoài form";
    document.body.append(form, outside);
    outsideNodes.push(form, outside);
    return { form, input, submit, outside };
  }

  it("focus trong ô nhập của form khác → hoãn (chưa shown); rời hẳn form thì hiện", () => {
    const { input, outside } = mountOtherForm();
    renderWithIntl(<ConsultPopup />);
    input.focus();
    advance(POPUP_DELAY_MS);
    expect(dialog()).toBeNull();
    expect(window.sessionStorage.getItem(CONSULT_POPUP_SHOWN_KEY)).toBeNull();
    act(() => outside.focus());
    advance(RECHECK_MS);
    expect(dialog()).not.toBeNull();
  });

  it("Tab sang nút gửi trong CÙNG form vẫn coi là còn trong form: popup chưa mở; blur hẳn mới mở", () => {
    const { input, submit } = mountOtherForm();
    renderWithIntl(<ConsultPopup />);
    input.focus();
    advance(POPUP_DELAY_MS);
    act(() => submit.focus());
    advance(RECHECK_MS * 4);
    expect(dialog()).toBeNull();
    act(() => submit.blur());
    advance(RECHECK_MS);
    expect(dialog()).not.toBeNull();
  });

  it("đang nhấn chuột trong form (Safari không focus nút) thì chưa mở; nhả chuột xong mới mở", () => {
    const { input, submit } = mountOtherForm();
    renderWithIntl(<ConsultPopup />);
    input.focus();
    advance(POPUP_DELAY_MS);
    act(() => {
      submit.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      input.blur();
    });
    advance(RECHECK_MS * 4);
    expect(dialog()).toBeNull();
    act(() => {
      submit.dispatchEvent(new Event("pointerup", { bubbles: true }));
    });
    advance(RECHECK_MS);
    expect(dialog()).not.toBeNull();
  });

  it("focus ngoài form thì không hoãn", () => {
    mountOtherForm();
    renderWithIntl(<ConsultPopup />);
    advance(POPUP_DELAY_MS);
    expect(dialog()).not.toBeNull();
  });

  it("đang có dialog/modal khác mở thì không mở chồng; đóng xong mới mở", () => {
    const other = document.createElement("div");
    other.setAttribute("role", "dialog");
    other.setAttribute("aria-modal", "true");
    document.body.append(other);
    outsideNodes.push(other);
    renderWithIntl(<ConsultPopup />);
    advance(POPUP_DELAY_MS + RECHECK_MS * 4);
    expect(window.sessionStorage.getItem(CONSULT_POPUP_SHOWN_KEY)).toBeNull();
    other.remove();
    advance(RECHECK_MS);
    expect(dialog()).not.toBeNull();
  });
});

describe("ConsultPopup: sessionStorage lỗi", () => {
  it("getItem ném lỗi → không hiện, không crash", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => renderWithIntl(<ConsultPopup />)).not.toThrow();
    advance(POPUP_DELAY_MS * 2);
    expect(dialog()).toBeNull();
  });

  it("setItem ném lỗi (đầy/chặn) → không hiện, không crash", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => renderWithIntl(<ConsultPopup />)).not.toThrow();
    advance(POPUP_DELAY_MS * 2);
    expect(dialog()).toBeNull();
  });
});

describe("ConsultPopup: a11y, ngôn ngữ, gửi lead", () => {
  async function openPopup(locale: "vi" | "en" = "vi") {
    vi.useRealTimers();
    startSessionLongAgo();
    const opener = document.createElement("button");
    document.body.append(opener);
    outsideNodes.push(opener);
    opener.focus();
    renderWithIntl(<ConsultPopup />, locale);
    await screen.findByRole("dialog");
    return opener;
  }

  it("Esc đóng và trả focus về phần tử trước đó", async () => {
    const user = userEvent.setup();
    const opener = await openPopup();
    await user.keyboard("{Escape}");
    expect(dialog()).toBeNull();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("bấm nền đóng", async () => {
    const user = userEvent.setup();
    await openPopup();
    await user.click(document.querySelector("[data-slot='dialog-overlay']") as HTMLElement);
    expect(dialog()).toBeNull();
  });

  it("bẫy Tab trong dialog", async () => {
    const user = userEvent.setup();
    await openPopup();
    const box = screen.getByRole("dialog");
    for (let step = 0; step < 12; step += 1) {
      await user.tab();
      expect(box).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("bản EN dùng chữ tiếng Anh", async () => {
    await openPopup("en");
    expect(screen.getByRole("dialog", { name: "Get free advice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("gửi form: source=popup không có sourceId, thành công hiện lời cảm ơn trong dialog", async () => {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({ success: true, data: { received: true } }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    await openPopup();
    await user.type(screen.getByLabelText(/Họ và tên/), "Nguyễn Văn A");
    await user.type(screen.getByLabelText(/Số điện thoại/), "0901234567");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Nhận tư vấn ngay" }));
    expect(await screen.findByText("Cảm ơn anh/chị!")).toBeInTheDocument();
    expect(dialog()).not.toBeNull();
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string) as Record<string, unknown>;
    expect(body).toMatchObject({ source: "popup", locale: "vi" });
    expect(body).not.toHaveProperty("sourceId");
  });
});
