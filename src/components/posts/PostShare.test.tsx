import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { PostShare, PostShareRail } from "./PostShare";

const URL = "https://tami.example/tin-bds/uu-dai?x=1&y=2";

afterEach(() => vi.unstubAllGlobals());

/** Nút gọn (< sm) nằm trong cụm có class `sm:hidden`; cụm hàng ngang (sm–<xl) là `ShareButtons` tái dùng. */
function compactButton() {
  return screen.getByRole("button", { name: "Chia sẻ" });
}

describe("PostShare — nút gọn < sm (Web Share API)", () => {
  it("có navigator.share: gọi với tiêu đề + URL canonical, KHÔNG mở menu", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    renderWithIntl(<PostShare url={URL} title="Ưu đãi" />);
    const button = compactButton();
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "Ưu đãi", url: URL }));
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("người dùng huỷ (AbortError): bỏ qua, menu vẫn đóng", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"));
    vi.stubGlobal("navigator", { share });
    renderWithIntl(<PostShare url={URL} title="Ưu đãi" />);
    fireEvent.click(compactButton());
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(compactButton()).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(compactButton().getAttribute("aria-controls") ?? "")).toHaveAttribute("hidden");
  });

  it("share lỗi khác (không phải huỷ) → mở menu dự phòng", async () => {
    const share = vi.fn().mockRejectedValue(new TypeError("not allowed"));
    vi.stubGlobal("navigator", { share });
    renderWithIntl(<PostShare url={URL} title="Ưu đãi" />);
    fireEvent.click(compactButton());
    await waitFor(() => expect(compactButton()).toHaveAttribute("aria-expanded", "true"));
  });

  it("không có Web Share API: mở menu Facebook, Zalo, sao chép; Esc đóng và trả focus về nút", () => {
    vi.stubGlobal("navigator", {});
    renderWithIntl(<PostShare url={URL} title="Ưu đãi" />);
    const button = compactButton();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const menu = document.getElementById(button.getAttribute("aria-controls") ?? "");
    expect(menu).not.toHaveAttribute("hidden");
    const inMenu = within(menu as HTMLElement);
    expect(inMenu.getByRole("link", { name: "Chia sẻ lên Facebook" })).toHaveAttribute("href", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL)}`);
    expect(inMenu.getByRole("link", { name: "Chia sẻ qua Zalo" }).getAttribute("href")).toContain(encodeURIComponent(URL));
    expect(inMenu.getByRole("button", { name: "Sao chép liên kết" })).toBeInTheDocument();
    fireEvent.keyDown(menu as HTMLElement, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(menu).toHaveAttribute("hidden");
    expect(document.activeElement).toBe(button);
  });

  it("bấm ra ngoài đóng menu", () => {
    vi.stubGlobal("navigator", {});
    renderWithIntl(<PostShare url={URL} title="Ưu đãi" />);
    fireEvent.click(compactButton());
    expect(compactButton()).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerDown(document.body);
    expect(compactButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("sao chép trong menu: ghi clipboard và báo qua vùng status (EN)", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    renderWithIntl(<PostShare url={URL} title="Offer" />, "en");
    const button = screen.getByRole("button", { name: "Share" });
    fireEvent.click(button);
    const menu = document.getElementById(button.getAttribute("aria-controls") ?? "") as HTMLElement;
    fireEvent.click(within(menu).getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(within(menu).getByRole("status")).toHaveTextContent("Link copied"));
    expect(writeText).toHaveBeenCalledWith(URL);
  });

  it("không có URL gốc: menu chỉ còn sao chép (không link chia sẻ URL sai)", () => {
    vi.stubGlobal("navigator", {});
    renderWithIntl(<PostShare title="Ưu đãi" />);
    fireEvent.click(compactButton());
    const menu = document.getElementById(compactButton().getAttribute("aria-controls") ?? "") as HTMLElement;
    expect(within(menu).queryByRole("link")).toBeNull();
    expect(within(menu).getByRole("button", { name: "Sao chép liên kết" })).toBeInTheDocument();
  });
});

describe("PostShare — mỗi breakpoint chỉ một cụm hiển thị", () => {
  it("cụm gọn `sm:hidden`; hàng ngang (ShareButtons) `hidden sm:… xl:hidden`", () => {
    const { container } = renderWithIntl(<PostShare url={URL} title="Ưu đãi" />);
    const compact = compactButton().closest("[data-share-variant='compact']");
    expect(compact?.className).toContain("sm:hidden");
    const row = container.querySelector("[data-share-variant='row']");
    expect(row?.className).toMatch(/\bhidden\b/);
    expect(row?.className).toMatch(/\bsm:(block|flex)\b/);
    expect(row?.className).toContain("xl:hidden");
    expect(within(row as HTMLElement).getByRole("group", { name: "Chia sẻ bài viết" })).toBeInTheDocument();
  });

  it("wrapper ngoài cũng `xl:hidden` để không chừa khoảng trống trong header khi chỉ còn rail", () => {
    const { container } = renderWithIntl(<PostShare url={URL} title="Ưu đãi" />);
    expect(container.firstElementChild?.className).toContain("xl:hidden");
  });
});

describe("PostShareRail — cụm dọc dính ≥ xl", () => {
  it("chỉ hiện từ xl, con `sticky`; icon có aria-label; sao chép báo qua status", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { container } = renderWithIntl(<PostShareRail url={URL} />);
    const rail = container.firstElementChild as HTMLElement;
    expect(rail.className).toMatch(/\bhidden\b/);
    expect(rail.className).toContain("xl:block");
    const sticky = rail.querySelector(".sticky") as HTMLElement;
    expect(sticky).not.toBeNull();
    // Ảnh bìa (positioned, đứng sau trong DOM) không được vẽ đè rail → wrapper nâng z theo token, dưới header (--z-header).
    expect(rail.className).toContain("z-(--z-raised)");
    // Wrapper absolute cao suốt vùng bài: chỉ cụm nút nhận click, cột trống không chặn click ảnh bìa.
    expect(rail.className).toContain("pointer-events-none");
    expect(sticky.className).toContain("pointer-events-auto");
    expect(screen.getByRole("link", { name: "Chia sẻ lên Facebook" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Chia sẻ lên Facebook" })).toHaveAttribute("title", "Chia sẻ lên Facebook");
    expect(screen.getByRole("link", { name: "Chia sẻ qua Zalo" }).className).toContain("text-xsmall");
    expect(screen.getByRole("link", { name: "Chia sẻ qua Zalo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sao chép liên kết" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Đã sao chép liên kết"));
    expect(writeText).toHaveBeenCalledWith(URL);
  });

  it("không có URL gốc: chỉ còn nút sao chép", () => {
    renderWithIntl(<PostShareRail />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("button", { name: "Sao chép liên kết" })).toBeInTheDocument();
  });
});
