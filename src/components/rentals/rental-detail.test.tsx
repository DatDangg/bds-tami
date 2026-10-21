import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { StrengthsView } from "@/lib/home/home-view";
import { toRentalCardData, toRentalDetailView } from "@/lib/rentals/rental-view";
import type { Category, Media, Project, Province, Rental } from "@/payload-types";
import { RentalDetail } from "./RentalDetail";

const now = "2026-01-01T00:00:00.000Z";
const image = (id: string): Media => ({ ...fakeMedia(id), id, mimeType: "image/webp", updatedAt: now, createdAt: now });
const province: Province = { id: "p1", code: "79", name: "Thành phố Hồ Chí Minh", shortName: "TP.HCM", slug: "ho-chi-minh", updatedAt: now, createdAt: now };
const category = { id: "c1", name: "Căn hộ", slug: "can-ho", scope: "rental", hasEnglish: true, updatedAt: now, createdAt: now } as unknown as Category;
const project = { id: "d1", title: "Sông Sài Gòn", slug: "song-sai-gon", hasEnglish: true } as Project;
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
    gallery: [image("g1")],
    updatedAt: now,
    createdAt: now,
    ...overrides,
  }) as Rental;

const fullRental = baseRental({
  category,
  project,
  floor: "12",
  bedrooms: 2,
  bathrooms: 1,
  furnishing: "full",
  houseDirection: "SE",
  balconyDirection: "N",
  publishedAt: "2026-02-03T00:00:00.000Z",
  gallery: [image("g1"), image("g2"), image("g3"), image("g4")],
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  location: [106.7, 10.77],
  legalNote: "Sổ hồng riêng",
  description: lexical("Căn hộ thoáng mát") as never,
  rentalTerms: { minLeaseMonths: 6, depositMonths: 2, availableFrom: "2026-11-15T00:00:00.000Z" },
  amenities: ["pool", "gym"],
});

const similarRental = baseRental({ id: "r2", code: "CT-000002", title: "Căn tương tự", slug: "can-tuong-tu" });
const strengths: StrengthsView = { eyebrow: "Vì sao chọn TAMI", title: "Điểm mạnh", items: [] } as unknown as StrengthsView;

function renderRental(
  doc: Rental,
  { similar = [] as Rental[], withHotline = true, locale = "vi" as "vi" | "en", withStrengths = false } = {},
) {
  const similarCards = similar.flatMap((item) => toRentalCardData(item, locale) ?? []);
  return renderWithIntl(
    <RentalDetail
      doc={doc}
      view={toRentalDetailView(doc, locale)}
      similar={similarCards}
      sale={null}
      {...(withHotline ? { hotline: { label: "0901 234 567", telHref: "tel:0901234567" } } : {})}
      ownPath="/cho-thue/can-ho-2pn-quan-1"
      strengths={withStrengths ? strengths : null}
      consultBanner={<section data-testid="consult-banner" />}
    />,
    locale,
  );
}

vi.mock("@/components/home/StrengthsBlock", () => ({ StrengthsBlock: () => <section data-testid="strengths" /> }));

class FakeIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
const tabs = () => screen.getByRole("navigation", { name: "Mục lục tin cho thuê" });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("RentalDetail (BL-052, khung chi tiết chung)", () => {
  it("đủ dữ liệu: tab đúng thứ tự, mỗi neo trỏ tới phần tử có thật, một h1 trong hero", () => {
    const { container } = renderRental(fullRental);
    const links = within(tabs()).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Tổng quan", "Vị trí", "Tiện ích", "Hình ảnh", "Điều khoản thuê", "Pháp lý"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#overview", "#location", "#amenities", "#gallery", "#terms", "#legal"]);
    for (const link of links) expect(container.querySelector(link.getAttribute("href")!), link.getAttribute("href")!).not.toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("[data-detail-hero]")).toContainElement(screen.getByRole("heading", { level: 1, name: "Căn hộ 2PN Quận 1" }));
    for (const name of ["Tổng quan", "Vị trí", "Tiện ích đi kèm", "Hình ảnh thực tế", "Điều khoản thuê", "Pháp lý"]) {
      expect(screen.getByRole("heading", { level: 2, name }), name).toBeInTheDocument();
    }
    expect(screen.getByText("Sổ hồng riêng")).toBeInTheDocument();
  });

  it("tin tối thiểu (1 ảnh, không mô tả/toạ độ/tiện ích/điều khoản/pháp lý/video): chỉ tab Tổng quan, không dải, không nút video", () => {
    const { container } = renderRental(baseRental());
    expect(within(tabs()).getAllByRole("link").map((link) => link.textContent)).toEqual(["Tổng quan"]);
    for (const id of ["location", "amenities", "gallery", "terms", "legal"]) expect(container.querySelector(`#${id}`), id).toBeNull();
    expect(container.querySelector("[data-detail-band]")).toBeNull();
    expect(screen.queryByRole("button", { name: "Xem video giới thiệu" })).toBeNull();
    // Thanh thông số chỉ còn ô có dữ liệu: giá + diện tích.
    const bar = within(screen.getByRole("group", { name: "Thông số chính" }));
    expect(bar.getAllByRole("term").map((term) => term.textContent)).toEqual(["Giá thuê", "Diện tích"]);
  });

  it("bố cục: chỉ Tổng quan (thẻ trắng) cạnh cột liên hệ; các khối sau là dải rộng hết khung nền xen kẽ", () => {
    const { container } = renderRental(fullRental);
    const aside = screen.getByRole("complementary", { name: "Nhận tư vấn" });
    const grid = aside.parentElement as HTMLElement;
    const cards = grid.firstElementChild as HTMLElement;
    expect(cards).toHaveAttribute("data-section-style", "cards");
    expect(cards.querySelectorAll("section[id]")).toHaveLength(1);
    expect((cards.querySelector("#overview") as HTMLElement).className).toContain("group-data-[section-style=cards]/detail:bg-surface");
    const bands = Array.from(container.querySelectorAll<HTMLElement>("[data-detail-band]"));
    expect(bands.map((band) => band.querySelector("[id]")?.id)).toEqual(["location", "amenities", "gallery", "terms", "legal"]);
    expect(bands.map((band) => band.className)).toEqual(["bg-surface", "bg-bg-alt", "bg-surface", "bg-bg-alt", "bg-surface"]);
    for (const band of bands) expect(follows(aside, band)).toBe(true);
    // Cột liên hệ dính trong phạm vi Tổng quan, không cuộn riêng.
    const sticky = aside.firstElementChild as HTMLElement;
    expect(sticky.className).toContain("lg:sticky");
    expect(sticky.className).toContain("--detail-aside-h");
    expect(sticky.className).not.toMatch(/max-h|overflow-y/);
    expect(within(aside).getByRole("link", { name: "Gọi ngay 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
  });

  it("hero: breadcrumb trên ảnh, chip danh mục + mã tin, vị trí, nút video + 'Xem tất cả 4 ảnh'; không badge 'Còn trống', không nút chia sẻ", async () => {
    const { container } = renderRental(fullRental);
    const hero = container.querySelector("[data-detail-hero]") as HTMLElement;
    expect(hero).toContainElement(screen.getByRole("navigation", { name: "Đường dẫn trang (Breadcrumb)" }));
    expect(hero).toHaveTextContent("Căn hộ");
    expect(hero).toHaveTextContent("Mã tin CT-000001");
    expect(hero).toHaveTextContent("TP.HCM");
    expect(hero).not.toHaveTextContent("Còn trống");
    expect(within(hero).getAllByRole("button", { name: "Xem tất cả 4 ảnh" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Chia sẻ" })).toBeNull();
    await userEvent.click(within(hero).getByRole("button", { name: "Xem video giới thiệu" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: /Phát video/i })).toBeInTheDocument();
  });

  it("thanh thông số đúng 6 ô theo thứ tự spec", () => {
    renderRental(fullRental);
    const bar = within(screen.getByRole("group", { name: "Thông số chính" }));
    expect(bar.getAllByRole("term").map((term) => term.textContent)).toEqual(["Giá thuê", "Diện tích", "Phòng ngủ / tắm", "Nội thất", "Hướng", "Dọn vào từ"]);
    expect(bar.getAllByRole("definition").map((value) => value.textContent)).toEqual(["12 triệu​/tháng", "55 m²", "2 phòng ngủ · 1 WC", "Đầy đủ", "Đông Nam", "15/11/2026"]);
  });

  it("giá: tick thương lượng → 'Thương lượng'; chưa nhập giá → 'Liên hệ' (thanh thông số + cột liên hệ)", () => {
    const { unmount } = renderRental(baseRental({ priceNegotiable: true }));
    expect(within(screen.getByRole("group", { name: "Thông số chính" })).getByText("Thương lượng")).toBeInTheDocument();
    expect(within(screen.getByRole("complementary")).getByText("Thương lượng")).toBeInTheDocument();
    unmount();
    renderRental(baseRental({ priceMonthlyVnd: null }));
    expect(within(screen.getByRole("group", { name: "Thông số chính" })).getByText("Liên hệ")).toBeInTheDocument();
  });

  it("Tổng quan: mô tả + lưới thông tin (mã tin, danh mục/dự án là link nội bộ, tầng, hướng ban công, ngày đăng)", () => {
    renderRental(fullRental);
    const overview = within(document.querySelector("#overview") as HTMLElement);
    expect(overview.getByText("Căn hộ thoáng mát")).toBeInTheDocument();
    const info = within(overview.getByLabelText("Thông tin căn"));
    expect(info.getAllByRole("term").map((term) => term.textContent)).toEqual(["Mã tin", "Danh mục", "Tầng", "Hướng ban công", "Thuộc dự án", "Đăng ngày"]);
    expect(info.getByRole("link", { name: "Căn hộ" })).toHaveAttribute("href", "/cho-thue/danh-muc/can-ho");
    const projectLink = info.getByRole("link", { name: "Sông Sài Gòn" });
    expect(projectLink).toHaveAttribute("href", "/du-an/song-sai-gon");
    expect(projectLink).not.toHaveAttribute("target");
    expect(info.getByText("Bắc")).toBeInTheDocument();
    expect(info.getByText("03/02/2026")).toBeInTheDocument();
  });

  it("tiện ích: lưới ô icon + nhãn dùng chung với bộ lọc", () => {
    const { container } = renderRental(fullRental);
    const amenities = within(container.querySelector("#amenities") as HTMLElement);
    expect(amenities.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Hồ bơi", "Phòng gym"]);
  });

  it("cuối trang: Căn tương tự (+ 'Xem tất cả căn cho thuê') → dải Điểm mạnh → banner tư vấn; banner ngoài aside", () => {
    const { container } = renderRental(fullRental, { similar: [similarRental], withStrengths: true });
    const similarHeading = screen.getByRole("heading", { level: 2, name: "Căn tương tự" });
    const section = similarHeading.closest("section") as HTMLElement;
    expect(within(section).getByRole("link", { name: /Xem tất cả căn cho thuê/ })).toHaveAttribute("href", "/cho-thue");
    expect(within(section).getByRole("heading", { level: 3, name: "Căn tương tự" })).toBeInTheDocument();
    const strengthsBlock = screen.getByTestId("strengths");
    const banner = screen.getByTestId("consult-banner");
    expect(follows(container.querySelector("#legal") as HTMLElement, similarHeading)).toBe(true);
    expect(follows(similarHeading, strengthsBlock)).toBe(true);
    expect(follows(strengthsBlock, banner)).toBe(true);
    expect(container.querySelector("aside")?.contains(banner)).toBe(false);
  });

  it("không có cờ Điểm mạnh → không dải", () => {
    renderRental(fullRental);
    expect(screen.queryByTestId("strengths")).toBeNull();
  });

  it("form lead chỉ MỘT bản (#lead-form trong cột liên hệ), scroll-mt theo --sticky-top", () => {
    const { container } = renderRental(fullRental);
    expect(container.querySelectorAll("#lead-form")).toHaveLength(1);
    expect(container.querySelectorAll("form")).toHaveLength(1);
    const slot = container.querySelector("#lead-form") as HTMLElement;
    expect(container.querySelector("aside")?.contains(slot)).toBe(true);
    expect(slot.className).toContain("scroll-mt-[calc(var(--sticky-top)+4.5rem)]");
  });

  it("tin đã thuê: badge trên hero, băng + 'Căn tương tự đang trống' ngay sau thanh thông số (trước tab), giá tham khảo, Điều khoản thu gọn, tiêu đề form riêng, vẫn một form", () => {
    const { container } = renderRental({ ...fullRental, status: "rented" } as Rental, { similar: [similarRental] });
    const hero = container.querySelector("[data-detail-hero]") as HTMLElement;
    expect(within(hero).getByText("Đã thuê")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Căn này đã được cho thuê");
    const bar = screen.getByRole("group", { name: "Thông số chính" });
    const similarHeading = screen.getByRole("heading", { level: 2, name: "Căn tương tự đang trống" });
    expect(follows(bar, screen.getByRole("status"))).toBe(true);
    expect(follows(screen.getByRole("status"), similarHeading)).toBe(true);
    expect(follows(similarHeading, tabs())).toBe(true);
    // Khoảng 32px trước thanh tab (BL-031): cùng khối `pb-8` với thanh thông số.
    expect(tabs().previousElementSibling?.contains(similarHeading)).toBe(true);
    expect(tabs().previousElementSibling?.className).toContain("pb-8");
    expect(within(bar).getByText("Giá tham khảo")).toBeInTheDocument();
    // Không lặp "Căn tương tự" ở cuối trang.
    expect(screen.queryByRole("heading", { level: 2, name: "Căn tương tự" })).toBeNull();
    const terms = container.querySelector("#terms") as HTMLElement;
    const details = terms.querySelector("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(within(terms).queryByRole("heading", { level: 2 })).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Nhận tư vấn căn tương tự" })).toBeInTheDocument();
    expect(container.querySelectorAll("form")).toHaveLength(1);
  });

  it("tin còn trống: không băng, 'Căn tương tự' sau các dải; Điều khoản là h2 thật", () => {
    const { container } = renderRental(fullRental, { similar: [similarRental] });
    expect(screen.queryByRole("status")).toBeNull();
    expect(follows(container.querySelector("aside") as HTMLElement, screen.getByRole("heading", { level: 2, name: "Căn tương tự" }))).toBe(true);
    expect(container.querySelector("#terms details")).toBeNull();
  });

  it("/en: nhãn tiếng Anh cho tab và thanh thông số", () => {
    renderRental(fullRental, { locale: "en" });
    expect(within(screen.getByRole("navigation", { name: "Listing contents" })).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Overview",
      "Location",
      "Amenities",
      "Photos",
      "Rental terms",
      "Legal",
    ]);
    const bar = within(screen.getByRole("group", { name: "Key facts" }));
    expect(bar.getByText("Move in from")).toBeInTheDocument();
    expect(bar.getByText("Bed / bath")).toBeInTheDocument();
  });
});
