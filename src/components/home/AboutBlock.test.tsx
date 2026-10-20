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
  it("mảng nền be (primary-soft) đứng sau ảnh phụ, chỉ trang trí; không ảnh phụ thì không dựng", () => {
    const { unmount } = renderWithIntl(<AboutBlock block={view()} />);
    const backdrop = screen.getByTestId("about-backdrop");
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
    expect(backdrop).toHaveClass("bg-primary-soft", "hidden", "lg:block");
    unmount();
    renderWithIntl(<AboutBlock block={view({ secondaryImage: null })} />);
    expect(screen.queryByTestId("about-backdrop")).toBeNull();
  });

  it("thiếu ảnh lớn thì ẩn cả cụm ảnh (kể cả nút video); số liệu dài được phép xuống dòng", () => {
    renderWithIntl(<AboutBlock block={view({ image: null, stats: [{ value: "10.000.000+", label: "khách", icon: "shield-check" }] })} />);
    expect(screen.queryByRole("button", { name: "Khám phá TAMI HOMES" })).toBeNull();
    expect(screen.getByText("10.000.000+")).toHaveClass("break-words");
  });

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

  it("nền khối kem ấm (primary-subtle) để mảng be primary-soft sau ảnh phụ vẫn phân biệt được", () => {
    const { container } = renderWithIntl(<AboutBlock block={view()} />);
    expect(container.querySelector("section")).toHaveClass("bg-primary-subtle");
    // Đệm dưới nhỏ + đánh dấu để Dự án nổi bật liền sau thu pt (khoảng ~42px như mockup).
    expect(container.querySelector("section")).toHaveClass("pb-6");
    expect(container.querySelector("section")).toHaveAttribute("data-block", "about");
    expect(screen.getByTestId("about-backdrop")).toHaveClass("bg-primary-soft");
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

  it("không có link video → không có nút play", () => {
    renderWithIntl(<AboutBlock block={view({ videoEmbedUrl: null })} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("có link video, nhãn trống → nút play dùng nhãn mặc định đúng ngôn ngữ (vi và /en)", () => {
    const { unmount } = renderWithIntl(<AboutBlock block={view({ videoLabel: null })} />);
    expect(screen.getByRole("button", { name: "Khám phá TAMI HOMES" })).toBeInTheDocument();
    unmount();
    renderWithIntl(<AboutBlock block={view({ videoLabel: null })} />, "en");
    expect(screen.getByRole("button", { name: "Discover TAMI HOMES" })).toBeInTheDocument();
  });

  it("eyebrow trống → chữ mặc định 'Về chúng tôi' / 'About us'; có giá trị → dùng giá trị admin", () => {
    const { unmount } = renderWithIntl(<AboutBlock block={view({ eyebrow: null })} />);
    expect(screen.getByText("Về chúng tôi")).toHaveClass("text-accent-text");
    unmount();
    const second = renderWithIntl(<AboutBlock block={view({ eyebrow: null })} />, "en");
    expect(screen.getByText("About us")).toBeInTheDocument();
    second.unmount();
    renderWithIntl(<AboutBlock block={view({ eyebrow: "Giới thiệu" })} />);
    expect(screen.getByText("Giới thiệu")).toBeInTheDocument();
    expect(screen.queryByText("Về chúng tôi")).toBeNull();
  });

  it("thiếu chữ (vd chưa có bản EN) → ẩn accent/chú thích/nút, không lấy chữ Việt; không ảnh → không cụm ảnh", () => {
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
