import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { AboutView } from "@/lib/home/home-view";
import { AboutBlock } from "./AboutBlock";

const richText = {
  root: { type: "root", version: 1, children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text: "Giới thiệu TAMI." }] }] },
};
const EMBED = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1";

const view = (overrides: Partial<AboutView> = {}): AboutView => ({
  kind: "about",
  eyebrow: "Về chúng tôi",
  title: "Về",
  titleAccent: "TAMI HOMES",
  content: richText,
  image: fakeMedia("about"),
  secondaryImage: fakeMedia("second"),
  imageCaption: "Không gian sống\nhiện đại",
  videoEmbedUrl: EMBED,
  videoLabel: "Khám phá TAMI HOMES",
  stats: [
    { value: "10+", label: "năm kinh nghiệm", icon: "shield-check" },
    { value: "500+", label: "khách hàng", icon: null },
  ],
  cta: { label: "Tìm hiểu thêm", href: "/ve-chung-toi" },
  decorImage: fakeMedia("decor"),
  ...overrides,
});

describe("AboutBlock (BL-044)", () => {
  it("eyebrow + tiêu đề hai màu (accent là span) + mô tả + nút cuối khối", () => {
    renderWithIntl(<AboutBlock block={view()} />);
    expect(screen.getByText("Về chúng tôi")).toHaveClass("text-accent-text");
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Về TAMI HOMES");
    expect(within(heading).getByText("TAMI HOMES")).toHaveClass("text-accent-text");
    expect(screen.getByText("Giới thiệu TAMI.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tìm hiểu thêm" })).toHaveAttribute("href", "/ve-chung-toi");
  });

  it("số liệu: dl, icon trong ô tròn aria-hidden khi có icon, không ô khi thiếu icon", () => {
    const { container } = renderWithIntl(<AboutBlock block={view()} />);
    const items = container.querySelectorAll("dl > div");
    expect(items).toHaveLength(2);
    expect(items[0]?.querySelector("span[aria-hidden='true'].bg-primary-soft svg")).not.toBeNull();
    expect(items[1]?.querySelector("span[aria-hidden='true']")).toBeNull();
    expect(screen.getByText("10+").tagName).toBe("DD");
    expect(screen.getByText("năm kinh nghiệm").tagName).toBe("DT");
  });

  it("thẻ chú thích giữ xuống dòng, ảnh trang trí aria-hidden và alt rỗng", () => {
    const { container } = renderWithIntl(<AboutBlock block={view()} />);
    expect(screen.getByText(/Không gian sống/)).toHaveClass("whitespace-pre-line");
    const decor = container.querySelector("section > div[aria-hidden='true']");
    expect(decor).toHaveClass("pointer-events-none", "hidden", "xl:block");
    expect(decor?.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("nút play mở Dialog với iframe youtube-nocookie (chỉ khi mở), đóng bằng nút Đóng", async () => {
    renderWithIntl(<AboutBlock block={view()} />);
    expect(document.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Khám phá TAMI HOMES" }));
    const dialog = await screen.findByRole("dialog", { name: "Khám phá TAMI HOMES" });
    const frame = within(dialog).getByTitle("Khám phá TAMI HOMES");
    expect(frame.getAttribute("src")).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
    fireEvent.click(within(dialog).getByRole("button", { name: "Đóng video" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("không có link video (hoặc thiếu nhãn) → không có nút play", () => {
    const { unmount } = renderWithIntl(<AboutBlock block={view({ videoEmbedUrl: null })} />);
    expect(screen.queryByRole("button")).toBeNull();
    unmount();
    renderWithIntl(<AboutBlock block={view({ videoLabel: null })} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("thiếu chữ (vd chưa có bản EN) → ẩn eyebrow/accent/chú thích/nút, không lấy chữ Việt; không ảnh → không cụm ảnh", () => {
    const { container } = renderWithIntl(
      <AboutBlock block={view({ eyebrow: null, titleAccent: null, imageCaption: null, cta: null, image: null, secondaryImage: null, decorImage: null, videoEmbedUrl: null })} />,
      "en",
    );
    expect(screen.queryByText("Về chúng tôi")).toBeNull();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Về");
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
