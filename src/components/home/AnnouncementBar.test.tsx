import { fireEvent, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import en from "@/i18n/messages/en.json";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { announcementDismissedKey, announcementHash } from "@/lib/home/announcement-hash";
import type { AnnouncementView } from "@/lib/home/home-view";
import { AnnouncementBar } from "./AnnouncementBar";

const announcement = (overrides: Partial<AnnouncementView> = {}): AnnouncementView => {
  const text = overrides.text ?? "Mở bán đợt 2";
  const href = overrides.href === undefined ? "/du-an" : overrides.href;
  return { text, href, external: false, hash: announcementHash(text, href), ...overrides };
};

const KEY = announcementDismissedKey("vi");

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("announcementHash", () => {
  it("đổi chữ hoặc link thì hash đổi; cùng nội dung thì cùng hash", () => {
    expect(announcementHash("a", "/x")).toBe(announcementHash("a", "/x"));
    expect(announcementHash("a", "/x")).not.toBe(announcementHash("b", "/x"));
    expect(announcementHash("a", "/x")).not.toBe(announcementHash("a", "/y"));
    expect(announcementHash("a", null)).not.toBe(announcementHash("a", "/"));
  });
});

describe("AnnouncementBar", () => {
  it("region có nhãn, chữ là link khi có href; nút đóng có tên truy cập; link ngoài mở tab mới", () => {
    const internal = renderWithIntl(<AnnouncementBar announcement={announcement()} />);
    expect(screen.getByRole("region", { name: "Thông báo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở bán đợt 2" })).toHaveAttribute("href", "/du-an");
    expect(screen.getByRole("button", { name: "Đóng thông báo" })).toBeInTheDocument();
    internal.unmount();
    renderWithIntl(<AnnouncementBar announcement={announcement({ href: "https://ex.test/", external: true })} />);
    expect(screen.getByRole("link", { name: "Mở bán đợt 2" })).toHaveAttribute("target", "_blank");
  });

  it("không có href: chỉ là chữ, không link", () => {
    renderWithIntl(<AnnouncementBar announcement={announcement({ href: null })} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Mở bán đợt 2")).toBeInTheDocument();
  });

  it("đóng → biến mất và lưu hash nội dung; lần sau cùng nội dung thì ẩn, đổi nội dung thì hiện lại", () => {
    const first = announcement();
    const view = renderWithIntl(<AnnouncementBar announcement={first} />);
    fireEvent.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    expect(screen.queryByRole("region", { name: "Thông báo" })).toBeNull();
    expect(localStorage.getItem(KEY)).toBe(first.hash);
    view.unmount();

    const same = renderWithIntl(<AnnouncementBar announcement={first} />);
    expect(same.container.querySelector("section")).toBeNull();
    same.unmount();

    renderWithIntl(<AnnouncementBar announcement={announcement({ text: "Nội dung mới" })} />);
    expect(screen.getByRole("region", { name: "Thông báo" })).toBeInTheDocument();
  });

  it("localStorage bị chặn (throw): vẫn render, đóng được trong lần xem này", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderWithIntl(<AnnouncementBar announcement={announcement()} />);
    fireEvent.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    expect(screen.queryByRole("region", { name: "Thông báo" })).toBeNull();
  });

  it("khoá lưu trữ theo ngôn ngữ: đóng ở VI không ẩn thanh ở EN", () => {
    const first = announcement();
    const vi = renderWithIntl(<AnnouncementBar announcement={first} />);
    fireEvent.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    expect(localStorage.getItem(announcementDismissedKey("en"))).toBeNull();
    vi.unmount();
    renderWithIntl(<AnnouncementBar announcement={first} />, "en");
    expect(screen.getByRole("region", { name: "Announcement" })).toBeInTheDocument();
  });

  it("HTML server kèm hash + script giấu-trước-paint đúng khoá theo ngôn ngữ; render client thì không dựng script", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={en}>
        <AnnouncementBar announcement={announcement()} />
      </NextIntlClientProvider>,
    );
    expect(html).toContain(`data-announcement-hash="${announcement().hash}"`);
    expect(html).toContain("<script>");
    expect(html).toContain(announcementDismissedKey("en"));
    expect(html).not.toContain(announcementDismissedKey("vi"));
    const { container } = renderWithIntl(<AnnouncementBar announcement={announcement()} />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("là phần tử trong luồng (không absolute/fixed): chiếm chỗ phía trên header", () => {
    renderWithIntl(<AnnouncementBar announcement={announcement()} />);
    const bar = screen.getByRole("region", { name: "Thông báo" });
    expect(bar.className).not.toMatch(/\b(absolute|fixed|sticky)\b/);
  });

  it("EN: nhãn và nút đóng theo tiếng Anh", () => {
    renderWithIntl(<AnnouncementBar announcement={announcement()} />, "en");
    expect(screen.getByRole("region", { name: "Announcement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss announcement" })).toBeInTheDocument();
  });
});
