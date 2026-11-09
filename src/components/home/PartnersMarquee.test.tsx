import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { PartnerItemView, PartnersBlockView } from "@/lib/home/home-view-partners";
import { PartnersMarquee } from "./PartnersMarquee";

const partner = (id: string, overrides: Partial<PartnerItemView> = {}): PartnerItemView => ({ id, name: `Đối tác ${id}`, logo: null, website: null, ...overrides });
const many = (count: number, overrides: Partial<PartnerItemView> = {}) => Array.from({ length: count }, (_, index) => partner(String(index), overrides));

const block = (overrides: Partial<PartnersBlockView> = {}): PartnersBlockView => ({
  kind: "partners",
  title: "Đối tác",
  items: [partner("a", { name: "Vinhomes", logo: fakeMedia("vinhomes"), website: "https://vinhomes.vn" }), ...many(5)],
  ...overrides,
});

const track = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-paused]") as HTMLElement;

describe("PartnersMarquee (BL-107), dải chạy (> 4 đối tác)", () => {
  it("Trình đọc màn hình / Tab chỉ gặp mỗi đối tác 1 lần: bản nhân đôi aria-hidden + inert", () => {
    const { container } = renderWithIntl(<PartnersMarquee block={block()} />);
    const lists = container.querySelectorAll("ul");
    expect(lists).toHaveLength(2);
    expect(lists[0]).toHaveAttribute("aria-label", "Danh sách đối tác");
    expect(lists[0]).not.toHaveAttribute("aria-hidden");
    expect(lists[1]).toHaveAttribute("aria-hidden", "true");
    expect(lists[1]).toHaveAttribute("inert");
    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    // Link trong bản nhân đôi không vào cây truy cập; chỉ 1 link + 1 nút Dừng/Phát.
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("mục có website là link mở tab mới noopener noreferrer, tên truy cập = tên đối tác; không website thì không link", () => {
    renderWithIntl(<PartnersMarquee block={block()} />);
    const link = screen.getByRole("link", { name: "Vinhomes" });
    expect(link).toHaveAttribute("href", "https://vinhomes.vn");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByRole("link", { name: "Đối tác 0" })).toBeNull();
  });

  it("dừng khi hover/focus bằng CSS; reduced-motion không chạy, bản nhân đôi ẩn, mục xuống dòng; không điểm Tab thừa (vùng không tabindex)", () => {
    const { container } = renderWithIntl(<PartnersMarquee block={block()} />);
    const strip = track(container);
    expect(strip).toHaveClass("animate-partners-marquee", "motion-reduce:animate-none");
    expect(strip.className).toContain("group-hover/partners:[animation-play-state:paused]");
    // Focus bàn phím: về vị trí 0 (animate-none); focus chuột (focus-within) chỉ pause, không reset -> click không trượt link.
    expect(strip.className).toContain("group-has-[:focus-visible]/partners:animate-none");
    expect(strip.className).toContain("group-focus-within/partners:[animation-play-state:paused]");
    expect(strip.className).not.toContain("group-focus-within/partners:animate-none");
    expect(strip.parentElement).toHaveClass("group/partners", "overflow-hidden", "has-[:focus-visible]:[mask-image:none]");
    expect(container.querySelector("[tabindex]")).toBeNull();
    const [original, duplicate] = Array.from(container.querySelectorAll("ul"));
    expect(duplicate).toHaveClass("motion-reduce:hidden");
    expect(original).toHaveClass("motion-reduce:flex-wrap");
    expect(original).not.toHaveClass("motion-reduce:hidden");
  });

  it("nút Dừng / Phát nhìn thấy: bấm đổi nhãn + trạng thái dừng; ẩn khi reduced-motion; nằm ngoài vùng hover/focus", () => {
    const { container } = renderWithIntl(<PartnersMarquee block={block()} />);
    const button = screen.getByRole("button", { name: "Dừng dải đối tác" });
    expect(button.parentElement).toHaveClass("motion-reduce:hidden");
    expect(track(container).parentElement?.contains(button)).toBe(false);
    expect(track(container)).toHaveAttribute("data-paused", "false");
    fireEvent.click(button);
    expect(track(container)).toHaveAttribute("data-paused", "true");
    expect(track(container).className).toContain("data-[paused=true]:[animation-play-state:paused]");
    expect(screen.getByRole("button", { name: "Phát dải đối tác" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Phát dải đối tác" }));
    expect(track(container)).toHaveAttribute("data-paused", "false");
  });

  it("thời lượng vòng theo số mục, tối thiểu 24 giây", () => {
    const big = renderWithIntl(<PartnersMarquee block={block({ items: many(10) })} />);
    expect(track(big.container).style.animationDuration).toBe("40s");
    big.unmount();
    const small = renderWithIntl(<PartnersMarquee block={block()} />);
    expect(track(small.container).style.animationDuration).toBe("24s");
  });

  it("logo xám + mờ, về màu gốc khi hover/focus; ảnh trang trí (alt rỗng), lazy; thiếu logo thì chỉ tên", () => {
    const { container } = renderWithIntl(<PartnersMarquee block={block()} />);
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    for (const image of images) {
      expect(image).toHaveAttribute("alt", "");
      expect(image).toHaveAttribute("loading", "lazy");
    }
    const frame = images[0]?.closest("span.relative");
    expect(frame).toHaveClass("grayscale", "opacity-70", "group-hover/item:grayscale-0", "group-focus-within/item:grayscale-0");
    expect(within(container).getAllByText("Đối tác 0")).toHaveLength(2);
  });

  it("tiêu đề trống → chữ mặc định theo ngôn ngữ", () => {
    const vi = renderWithIntl(<PartnersMarquee block={block({ title: "" })} />);
    expect(screen.getByRole("heading", { level: 2, name: "Đối tác" })).toBeInTheDocument();
    vi.unmount();
    renderWithIntl(<PartnersMarquee block={block({ title: "" })} />, "en");
    expect(screen.getByRole("heading", { level: 2, name: "Partners" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause partner strip" })).toBeInTheDocument();
  });
});

describe("PartnersMarquee (BL-107), ≤ 4 đối tác", () => {
  it("hàng tĩnh căn giữa: không bản nhân đôi, không nút, không animation; mỗi đối tác 1 lần", () => {
    const { container } = renderWithIntl(<PartnersMarquee block={block({ items: [partner("a", { website: "https://a.vn" }), ...many(3)] })} />);
    expect(container.querySelectorAll("ul")).toHaveLength(1);
    expect(container.querySelector("ul[aria-hidden], [inert]")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector(".animate-partners-marquee, [data-paused]")).toBeNull();
    expect(container.querySelector("ul")).toHaveClass("justify-center");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Đối tác a" })).toHaveAttribute("target", "_blank");
  });

  it("tên dài: tĩnh và reduced-motion cho xuống dòng (không tràn ngang), chỉ dải đang chạy mới nowrap", () => {
    const longName = "Công ty Cổ phần Tập đoàn Đầu tư Phát triển Đất Xanh Miền Bắc";
    const staticView = renderWithIntl(<PartnersMarquee block={block({ items: [partner("a", { name: longName })] })} />);
    const staticName = screen.getByText(longName);
    expect(staticName.className).not.toContain("whitespace-nowrap");
    expect(staticName).toHaveClass("min-w-0", "[overflow-wrap:anywhere]");
    expect(staticName.closest("li")).toHaveClass("max-w-full", "min-w-0");
    expect(staticName.closest("li")).not.toHaveClass("shrink-0");
    staticView.unmount();
    renderWithIntl(<PartnersMarquee block={block({ items: many(5, { name: longName }) })} />);
    const [runningName] = screen.getAllByText(longName);
    expect(runningName).toHaveClass("whitespace-nowrap", "motion-reduce:whitespace-normal", "[overflow-wrap:anywhere]");
    expect(runningName?.closest("li")).toHaveClass("shrink-0", "motion-reduce:shrink", "min-w-0");
  });

  it("đúng 5 đối tác thì chạy", () => {
    const { container } = renderWithIntl(<PartnersMarquee block={block({ items: many(5) })} />);
    expect(container.querySelectorAll("ul")).toHaveLength(2);
  });
});
