import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { toRentalCardData, toRentalDetailView } from "@/lib/rentals/rental-view";
import type { Media, Province, Rental } from "@/payload-types";
import { RentalDetail } from "./RentalDetail";

const now = "2026-01-01T00:00:00.000Z";
const image = (id: string): Media => ({ ...fakeMedia(id), id, mimeType: "image/webp", updatedAt: now, createdAt: now });
const province: Province = { id: "p1", code: "79", name: "Thành phố Hồ Chí Minh", shortName: "TP.HCM", slug: "ho-chi-minh", updatedAt: now, createdAt: now };
const lexical = (text: string) => ({
  root: { type: "root", version: 1, direction: null, format: "", indent: 0, children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text }] }] },
});

const baseRental = (overrides: Partial<Rental> = {}): Rental =>
  ({
    id: "r1",
    code: "CT-000001",
    title: "Căn hộ 2PN Quận 1",
    slug: "can-ho-2pn-quan-1",
    status: "published",
    province,
    areaM2: 55,
    priceMonthlyVnd: 12_000_000,
    author: "s1",
    showExactAddress: false,
    gallery: [image("g1"), image("g2")],
    updatedAt: now,
    createdAt: now,
    ...overrides,
  }) as Rental;

const fullRental = baseRental({
  floor: "12",
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  location: [106.7, 10.77],
  legalNote: "Sổ hồng riêng",
  description: lexical("Mô tả căn hộ") as never,
  rentalTerms: { minLeaseMonths: 6, depositMonths: 2 },
});

const similarRental = baseRental({ id: "r2", code: "CT-000002", title: "Căn tương tự", slug: "can-tuong-tu" });

function renderRental(doc: Rental, { similar = [] as Rental[], withHotline = true } = {}) {
  const similarCards = similar.flatMap((item) => toRentalCardData(item, "vi") ?? []);
  return renderWithIntl(
    <RentalDetail
      doc={doc}
      view={toRentalDetailView(doc, "vi")}
      similar={similarCards}
      sale={null}
      {...(withHotline ? { hotline: { label: "0901 234 567", telHref: "tel:0901234567" } } : {})}
      ownPath="/cho-thue/can-ho-2pn-quan-1"
    />,
  );
}

class FakeIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("RentalDetail (S07, khung chi tiết chung)", () => {
  it("đủ dữ liệu: thanh mục con đúng thứ tự trang, mỗi neo trỏ tới phần tử có thật, một h1", () => {
    const { container } = renderRental(fullRental);
    const nav = screen.getByRole("navigation", { name: "Mục lục tin cho thuê" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Tổng quan", "Điều khoản", "Mô tả", "Video", "Vị trí", "Pháp lý"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#overview", "#terms", "#description", "#video", "#location", "#legal"]);
    for (const link of links) expect(container.querySelector(link.getAttribute("href")!), link.getAttribute("href")!).not.toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const h1 = screen.getByRole("heading", { level: 1, name: "Căn hộ 2PN Quận 1" });
    // Mục con (trừ Tổng quan) có h2 kiểu chung; Tổng quan dùng h1 làm nhãn, không có h2 "Tổng quan".
    for (const name of ["Điều khoản thuê", "Mô tả", "Video", "Vị trí", "Pháp lý"]) {
      expect(screen.getByRole("heading", { level: 2, name: new RegExp(name) }), name).toBeInTheDocument();
    }
    expect(screen.queryByRole("heading", { level: 2, name: "Tổng quan" })).toBeNull();
    expect(container.querySelector("#overview")).toHaveAttribute("aria-labelledby", h1.id);
    expect(screen.getByText("Mô tả căn hộ")).toBeInTheDocument();
    expect(screen.getByText("Sổ hồng riêng")).toBeInTheDocument();
  });

  it("thiếu dữ liệu: mục và khối tự ẩn, chỉ còn Tổng quan", () => {
    const { container } = renderRental(baseRental());
    const nav = screen.getByRole("navigation", { name: "Mục lục tin cho thuê" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Tổng quan"]);
    for (const id of ["terms", "description", "video", "location", "legal"]) expect(container.querySelector(`#${id}`), id).toBeNull();
  });

  it("dùng khung chung: nền trang chi tiết, cột chính là một thẻ trắng chứa các khối, thẻ liên hệ tách riêng trong aside và dính theo --sticky-top", () => {
    const { container } = renderRental(fullRental);
    expect(container.querySelector("[data-detail-page]")).not.toBeNull();
    const aside = container.querySelector("aside") as HTMLElement;
    expect(aside).not.toBeNull();
    const grid = aside.parentElement as HTMLElement;
    const card = grid.firstElementChild as HTMLElement;
    expect(card.contains(aside)).toBe(false);
    expect(card.className).toContain("bg-surface");
    expect(card.className).toContain("rounded-[28px]");
    for (const id of ["overview", "terms", "description", "video", "location", "legal"]) expect(card.querySelector(`#${id}`), id).not.toBeNull();
    // Thẻ liên hệ: thẻ trắng dính, có nhãn aria, không còn nền vàng nhạt / lề trên theo header cũ.
    const contact = aside.firstElementChild as HTMLElement;
    expect(contact.className).toContain("bg-surface");
    expect(contact.className).toContain("lg:sticky");
    expect(contact.className).toContain("lg:top-[calc(var(--sticky-top)+4.5rem)]");
    expect(contact.className).not.toContain("bg-primary-subtle");
    expect(contact.className).not.toContain("--header-offset");
    expect(aside).toHaveAttribute("aria-labelledby", "rental-consult-heading");
    expect(within(aside).getByRole("heading", { level: 2, name: "Nhận tư vấn" })).toHaveAttribute("id", "rental-consult-heading");
    expect(within(aside).getByRole("link", { name: /0901 234 567/ })).toHaveAttribute("href", "tel:0901234567");
    // Thẻ liên hệ sau thẻ nội dung trong DOM (< lg nằm dưới).
    expect(follows(card, aside)).toBe(true);
  });

  it("form lead chỉ MỘT bản trong DOM (#lead-form nằm trong thẻ liên hệ), scroll-mt theo --sticky-top", () => {
    const { container } = renderRental(fullRental);
    expect(container.querySelectorAll("#lead-form")).toHaveLength(1);
    expect(container.querySelectorAll("form")).toHaveLength(1);
    const slot = container.querySelector("#lead-form") as HTMLElement;
    expect(container.querySelector("aside")?.contains(slot)).toBe(true);
    expect(slot.className).toContain("scroll-mt-[calc(var(--sticky-top)+4.5rem)]");
    expect(slot.className).not.toContain("--header-offset");
    expect(slot.querySelector("form")).not.toBeNull();
  });

  it("tin đã thuê: băng + badge + 'Căn tương tự đang trống' ngay sau thư viện (trước thanh mục con), giá mờ, Điều khoản thu gọn, tiêu đề form riêng, vẫn một form", () => {
    const { container } = renderRental({ ...fullRental, status: "rented" } as Rental, { similar: [similarRental] });
    expect(screen.getByRole("status")).toHaveTextContent("Căn này đã được cho thuê");
    expect(screen.getByText("Đã thuê")).toBeInTheDocument();
    const similarHeading = screen.getByRole("heading", { level: 2, name: "Căn tương tự đang trống" });
    const nav = screen.getByRole("navigation", { name: "Mục lục tin cho thuê" });
    expect(follows(similarHeading, nav)).toBe(true);
    expect(screen.getAllByText("Giá tham khảo").length).toBeGreaterThan(0);
    // Điều khoản: accordion đóng, tiêu đề là summary (không thêm h2 thứ hai), neo #terms vẫn có.
    const terms = container.querySelector("#terms") as HTMLElement;
    const details = terms.querySelector("details") as HTMLDetailsElement;
    expect(details).not.toBeNull();
    expect(details.open).toBe(false);
    expect(within(terms).queryByRole("heading", { level: 2 })).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Nhận tư vấn căn tương tự" })).toBeInTheDocument();
    expect(container.querySelectorAll("form")).toHaveLength(1);
    expect(container.querySelectorAll("#lead-form")).toHaveLength(1);
  });

  it("tin còn trống: 'Tin tương tự' nằm sau lưới (ngoài thẻ), không kéo lên trước thanh mục con; không có băng; Điều khoản là h2 thật", () => {
    const { container } = renderRental(fullRental, { similar: [similarRental] });
    expect(screen.queryByRole("status")).toBeNull();
    const nav = screen.getByRole("navigation", { name: "Mục lục tin cho thuê" });
    const similarHeading = screen.getByRole("heading", { level: 2, name: "Tin tương tự" });
    expect(follows(nav, similarHeading)).toBe(true);
    expect(follows(container.querySelector("aside") as HTMLElement, similarHeading)).toBe(true);
    expect(screen.getByRole("heading", { level: 2, name: "Điều khoản thuê" })).toBeInTheDocument();
    expect(container.querySelector("#terms details")).toBeNull();
  });
});
