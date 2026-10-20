import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  amenities: ["pool", "gym"],
});

const similarRental = baseRental({ id: "r2", code: "CT-000002", title: "Căn tương tự", slug: "can-tuong-tu" });

function renderRental(doc: Rental, { similar = [] as Rental[], withHotline = true, locale = "vi" as "vi" | "en" } = {}) {
  const similarCards = similar.flatMap((item) => toRentalCardData(item, "vi") ?? []);
  return renderWithIntl(
    <RentalDetail
      doc={doc}
      view={toRentalDetailView(doc, "vi")}
      similar={similarCards}
      sale={null}
      {...(withHotline ? { hotline: { label: "0901 234 567", telHref: "tel:0901234567" } } : {})}
      ownPath="/cho-thue/can-ho-2pn-quan-1"
      shareUrl="https://tami.example/cho-thue/can-ho-2pn-quan-1"
      consultBanner={<section data-testid="consult-banner" />}
    />,
    locale,
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
  it("đủ dữ liệu: thanh mục con đúng thứ tự trang, mỗi neo trỏ tới phần tử có thật, một h1 (trong khối tiêu đề)", () => {
    const { container } = renderRental(fullRental);
    const nav = screen.getByRole("navigation", { name: "Mục lục tin cho thuê" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Tổng quan", "Thông tin chi tiết", "Tiện ích", "Điều khoản", "Video", "Vị trí", "Pháp lý"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#overview", "#details", "#amenities", "#terms", "#video", "#location", "#legal"]);
    for (const link of links) expect(container.querySelector(link.getAttribute("href")!), link.getAttribute("href")!).not.toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const h1 = screen.getByRole("heading", { level: 1, name: "Căn hộ 2PN Quận 1" });
    // Khối tiêu đề (chứa h1) nằm ngay trên thanh mục con, dưới ảnh lớn.
    expect(nav.previousElementSibling).toContainElement(h1);
    for (const name of ["Mô tả căn hộ", "Thông tin chi tiết", "Tiện ích đi kèm", "Điều khoản thuê", "Video", "Vị trí", "Pháp lý"]) {
      expect(screen.getByRole("heading", { level: 2, name }), name).toBeInTheDocument();
    }
    expect(screen.getByText("Mô tả căn hộ", { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText("Sổ hồng riêng")).toBeInTheDocument();
  });

  it("thiếu dữ liệu: mục và khối tự ẩn, chỉ còn Thông tin chi tiết", () => {
    const { container } = renderRental(baseRental());
    const nav = screen.getByRole("navigation", { name: "Mục lục tin cho thuê" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Thông tin chi tiết"]);
    for (const id of ["overview", "amenities", "terms", "video", "location", "legal"]) expect(container.querySelector(`#${id}`), id).toBeNull();
    expect(screen.queryByRole("button", { name: "Video" })).toBeNull();
  });

  it("khung thẻ: nền trang chi tiết, cột chính là chuỗi thẻ riêng (không thẻ bao ngoài), thẻ liên hệ tách riêng trong aside và dính theo --sticky-top", () => {
    const { container } = renderRental(fullRental);
    expect(container.querySelector("[data-detail-page]")).not.toBeNull();
    const aside = container.querySelector("aside") as HTMLElement;
    expect(aside).not.toBeNull();
    const grid = aside.parentElement as HTMLElement;
    const cards = grid.firstElementChild as HTMLElement;
    expect(cards.contains(aside)).toBe(false);
    expect(cards).toHaveAttribute("data-section-style", "cards");
    expect(cards.className).not.toContain("rounded-[28px]");
    for (const id of ["overview", "details", "amenities", "terms", "video", "location", "legal"]) {
      const section = cards.querySelector(`#${id}`) as HTMLElement;
      expect(section, id).not.toBeNull();
      expect(section.className, id).toContain("group-data-[section-style=cards]/detail:bg-surface");
      expect(section.querySelector("p.uppercase"), `eyebrow ${id}`).not.toBeNull();
    }
    // Thẻ liên hệ: thẻ trắng dính, có nhãn aria, không còn nền vàng nhạt / lề trên theo header cũ.
    const contact = aside.firstElementChild as HTMLElement;
    expect(contact.className).toContain("bg-surface");
    expect(contact.className).toContain("lg:sticky");
    expect(contact.className).toContain("--sticky-top)_+_4.5rem");
    expect(contact.className).toContain("--detail-aside-h");
    expect(contact.className).not.toMatch(/max-h|overflow-y/);
    expect(contact.className).not.toContain("bg-primary-subtle");
    expect(contact.className).not.toContain("--header-offset");
    expect(aside).toHaveAttribute("aria-labelledby", "rental-consult-heading");
    expect(within(aside).getByRole("heading", { level: 2, name: "Nhận tư vấn" })).toHaveAttribute("id", "rental-consult-heading");
    expect(within(aside).getByRole("link", { name: /0901 234 567/ })).toHaveAttribute("href", "tel:0901234567");
    // Thẻ liên hệ sau các thẻ nội dung trong DOM (< lg nằm dưới).
    expect(follows(cards, aside)).toBe(true);
  });

  it("ảnh lớn kiểu hero: breadcrumb kính trên ảnh, khối tiêu đề có badge Còn trống, eyebrow 'danh mục · mã tin', giá, địa chỉ, dải thông số và nút chia sẻ", () => {
    const { container } = renderRental({ ...fullRental, bedrooms: 2, bathrooms: 1, furnishing: "full", houseDirection: "SE" } as Rental);
    const hero = container.querySelector("[data-detail-gallery]") as HTMLElement;
    expect(hero).toContainElement(screen.getByRole("navigation", { name: "Đường dẫn trang (Breadcrumb)" }));
    expect(within(hero).getByRole("button", { name: "Xem tất cả ảnh" })).toBeInTheDocument();
    const h1 = screen.getByRole("heading", { level: 1 });
    const titleCard = h1.closest("div[class*='rounded-[28px]']") as HTMLElement;
    expect(titleCard).not.toBeNull();
    expect(titleCard).toHaveTextContent("Còn trống");
    expect(titleCard).toHaveTextContent("CT-000001");
    expect(titleCard).toHaveTextContent("Giá thuê");
    expect(titleCard).toHaveTextContent("12 triệu/tháng");
    expect(titleCard).toHaveTextContent("TP.HCM");
    const facts = within(screen.getByRole("list", { name: "Thông số chính" }));
    expect(facts.getByText("55 m²")).toBeInTheDocument();
    expect(facts.getByText("2 phòng ngủ")).toBeInTheDocument();
    expect(facts.getByText("1 WC")).toBeInTheDocument();
    expect(facts.getByText("Đầy đủ")).toBeInTheDocument();
    expect(facts.getByText("Đông Nam")).toBeInTheDocument();
    expect(within(titleCard).getByRole("button", { name: "Chia sẻ" })).toBeInTheDocument();
  });

  it("nút Video trên ảnh lớn chỉ khi có video; bấm mở hộp thoại chứa VideoFacade, khối Video vẫn có", async () => {
    renderRental(fullRental);
    const button = screen.getByRole("button", { name: "Video" });
    expect(screen.getByRole("heading", { level: 2, name: "Video" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(button);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: /Phát video/i })).toBeInTheDocument();
  });

  it("tiện ích: lưới ô icon + nhãn dùng chung với bộ lọc, bỏ khỏi khối Thông tin chi tiết", () => {
    const { container } = renderRental(fullRental);
    const amenities = within(container.querySelector("#amenities") as HTMLElement);
    expect(amenities.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Hồ bơi", "Phòng gym"]);
    expect(within(container.querySelector("#details") as HTMLElement).queryByText("Hồ bơi")).toBeNull();
  });

  it("banner tư vấn nhận từ trang nằm cuối, sau Căn tương tự; mục thẻ cuối không chứa nó", () => {
    const { container } = renderRental(fullRental, { similar: [similarRental] });
    const banner = screen.getByTestId("consult-banner");
    const similarHeading = screen.getByRole("heading", { level: 2, name: "Căn tương tự" });
    expect(follows(similarHeading, banner)).toBe(true);
    expect(container.querySelector("aside")?.contains(banner)).toBe(false);
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
    expect(follows(screen.getByRole("heading", { level: 1 }), similarHeading)).toBe(true);
    expect(follows(similarHeading, nav)).toBe(true);
    // Khối tin tương tự (nền xám) không dính sát thanh mục con.
    expect(nav.previousElementSibling?.className).toContain("pb-8");
    expect(nav.previousElementSibling?.contains(similarHeading)).toBe(true);
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
    const similarHeading = screen.getByRole("heading", { level: 2, name: "Căn tương tự" });
    expect(follows(nav, similarHeading)).toBe(true);
    expect(follows(container.querySelector("aside") as HTMLElement, similarHeading)).toBe(true);
    expect(screen.getByRole("heading", { level: 2, name: "Điều khoản thuê" })).toBeInTheDocument();
    expect(container.querySelector("#terms details")).toBeNull();
  });
});
