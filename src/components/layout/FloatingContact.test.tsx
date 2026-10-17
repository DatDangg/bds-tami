import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { FloatingContact } from "./FloatingContact";

vi.mock("next/navigation", () => ({ usePathname: () => "/en/for-rent" }));

const contact = {
  hotline: { label: "0901 234 567", telHref: "tel:0901234567" },
  zaloUrl: "https://zalo.me/tami",
  fanpageUrl: "https://facebook.com/tami",
};

const sendBeacon = vi.fn<(url: string, data: Blob) => boolean>(() => true);

beforeEach(() => {
  Object.defineProperty(navigator, "sendBeacon", { value: sendBeacon, configurable: true });
});
afterEach(() => sendBeacon.mockClear());

async function lastBeacon() {
  const [url, blob] = sendBeacon.mock.calls.at(-1)!;
  return { url, body: JSON.parse(await blob.text()) as unknown };
}

describe("FloatingContact", () => {
  it("bấm Zalo gửi sendBeacon đúng type + pagePath và vẫn để link mở", async () => {
    const user = userEvent.setup();
    renderWithIntl(<FloatingContact contact={contact} />, "vi");
    const zalo = screen.getByRole("link", { name: "Chat Zalo" });
    expect(zalo).toHaveAttribute("href", "https://zalo.me/tami");
    expect(zalo).toHaveAttribute("rel", "noopener noreferrer");
    await user.click(zalo);
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(await lastBeacon()).toEqual({
      url: "/api/public/click-events",
      body: { type: "zalo", pagePath: "/en/for-rent" },
    });
  });

  it("hotline và fanpage gửi đúng type", async () => {
    const user = userEvent.setup();
    renderWithIntl(<FloatingContact contact={contact} />, "vi");
    await user.click(screen.getByRole("link", { name: /Gọi hotline/ }));
    expect((await lastBeacon()).body).toMatchObject({ type: "hotline" });
    await user.click(screen.getByRole("link", { name: "Fanpage Facebook" }));
    expect((await lastBeacon()).body).toMatchObject({ type: "fanpage" });
  });

  it("thiếu link nào thì ẩn nút đó; không có link nào thì không render", () => {
    const one = renderWithIntl(<FloatingContact contact={{ zaloUrl: contact.zaloUrl }} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    one.unmount();
    const none = renderWithIntl(<FloatingContact contact={{}} />);
    expect(none.container).toBeEmptyDOMElement();
  });

  it("sendBeacon ném lỗi không làm hỏng việc bấm", async () => {
    sendBeacon.mockImplementationOnce(() => {
      throw new Error("blocked");
    });
    const user = userEvent.setup();
    renderWithIntl(<FloatingContact contact={contact} />);
    await expect(user.click(screen.getByRole("link", { name: "Chat Zalo" }))).resolves.toBeUndefined();
  });

  it("mobile: nút Liên hệ nhanh bung/thu gọn danh sách; nhãn theo ngôn ngữ; nút 48px", async () => {
    const user = userEvent.setup();
    renderWithIntl(<FloatingContact contact={contact} />, "en");
    const toggle = screen.getByRole("button", { name: "Quick contact" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("floating-contact-actions")).toHaveClass("hidden", "md:flex");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Close quick contact" })).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("floating-contact-actions")).toHaveClass("flex");
    for (const link of screen.getAllByRole("link")) expect(link).toHaveClass("size-12");
  });

  it("đáy cộng --floating-bottom-offset để nằm trên banner cookie", () => {
    renderWithIntl(<FloatingContact contact={contact} />);
    expect(screen.getByRole("group").className).toContain("var(--floating-bottom-offset,0px)");
  });
});
