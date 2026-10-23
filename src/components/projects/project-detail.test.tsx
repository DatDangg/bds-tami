import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chooseOption, fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { toProjectDetailView } from "@/lib/projects/project-detail-view";
import type { StrengthsView } from "@/lib/home/home-view";
import type { Locale } from "@/i18n/routing";
import type { Media, Project, Province } from "@/payload-types";
import viMessages from "@/i18n/messages/vi.json";
import { Documents } from "./Documents";
import { FloorPlans } from "./FloorPlans";
import { LegalPolicy } from "./LegalPolicy";
import { ProjectDetail } from "./ProjectDetail";
import { ProjectStickyCta } from "./ProjectStickyCta";
import { DetailSubNav } from "@/components/detail/DetailSubNav";

const now = "2026-01-01T00:00:00.000Z";
const image = (id: string): Media => ({ ...fakeMedia(id), id, mimeType: "image/webp", updatedAt: now, createdAt: now });
const pdf = (id: string, name: string): Media => ({
  id,
  alt: name,
  url: `/api/media/file/${id}.pdf`,
  mimeType: "application/pdf",
  filesize: 1024 * 1024,
  updatedAt: now,
  createdAt: now,
});
const province: Province = { id: "p1", code: "01", name: "Thành phố Hà Nội", shortName: "Hà Nội", slug: "ha-noi", updatedAt: now, createdAt: now };
const lexical = (text: string) => ({
  root: { type: "root", version: 1, direction: null, format: "", indent: 0, children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text }] }] },
});

const baseProject = (overrides: Partial<Project> = {}): Project =>
  ({
    id: "d1",
    title: "Dự án Sông Sài Gòn",
    slug: "song-sai-gon",
    summary: "Mô tả ngắn",
    status: "published",
    salesStatus: "selling",
    province,
    gallery: [image("g1"), image("g2"), image("g3")],
    author: "a1",
    updatedAt: now,
    createdAt: now,
    ...overrides,
  }) as Project;

const fullProject = baseProject({
  address: "Số 1 Đường A",
  location: [105.8, 21.03],
  priceFromVnd: 3_500_000_000,
  areaFromM2: 50,
  areaToM2: 120,
  scale: { totalUnits: 1200, blocks: 4, floors: 30, handoverTime: "Quý 4/2027" },
  overview: lexical("Nội dung tổng quan") as never,
  amenities: [{ name: "Hồ bơi" }, { name: "Phòng gym" }],
  floorPlans: [{ title: "Căn 2PN", image: image("f1") }, { title: "Căn 3PN", image: image("f2") }],
  legalInfo: lexical("Sổ hồng lâu dài") as never,
  salesPolicy: lexical("Chiết khấu 5%") as never,
  documents: [pdf("d1", "Bảng giá")],
});

function renderDetail(
  doc: Project,
  locale: Locale = "vi",
  related = [] as never[],
  listings?: { rentals: unknown[]; posts: unknown[] },
  withHotline = true,
  strengths: StrengthsView | null = null,
) {
  return renderWithIntl(
    <ProjectDetail
      doc={doc}
      view={toProjectDetailView(doc, locale)}
      related={related}
      {...(listings ? { listings: listings as never } : {})}
      {...(withHotline ? { hotline: { label: "0901 234 567", telHref: "tel:0901234567" } } : {})}
      strengths={strengths}
      ownPath={locale === "vi" ? "/du-an/song-sai-gon" : "/en/projects/saigon-riverside"}
      consultBanner={<section aria-label="Banner tư vấn" data-testid="consult-banner" />}
    />,
    locale,
  );
}

type ObserverCallback = (entries: { target: { id: string }; isIntersecting: boolean }[]) => void;
let observerCallback: ObserverCallback | null = null;
class FakeIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observerCallback = callback;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  observerCallback = null;
  document.documentElement.style.removeProperty("--sticky-cta-height");
});

const VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const developer = { id: "dv", name: "Vinhomes", website: "https://vinhomes.vn", updatedAt: now, createdAt: now };
const category = { id: "c1", name: "Căn hộ chung cư", hasEnglish: true } as never;

/** Dự án đủ trường BL-052 (video, sản phẩm, loại hình, mô tả tiện ích, ảnh tiện ích…) — đối chiếu design `detail-du-an`. */
const richProject = baseProject({
  ...fullProject,
  category,
  developer: developer as never,
  scale: { ...fullProject.scale, landAreaM2: 362_100 },
  priceTable: [{ unitType: "Căn 2PN", priceFrom: 3_000_000_000 }, { unitType: "Căn 3PN", priceFrom: 0 }],
  productTypes: ["villa", "apartment"],
  products: [
    { type: "Biệt thự đơn lập", count: 96, areaFrom: 200, areaTo: 360 },
    { type: "Shophouse xây thô", count: 0, areaFrom: 90 },
  ],
  videoUrl: VIDEO,
  amenities: ["Hồ cảnh quan", "Clubhouse", "Công viên", "Khu vui chơi", "Phòng gym", "Bể bơi"].map((name) => ({ name, description: `Mô tả ${name}` })),
  amenitiesImage: image("am1"),
  nearbyAmenities: [{ category: "education", name: "Trường quốc tế", distance: "7 phút" }],
});

const strengths = { kind: "strengths" as const, items: [{ icon: "star" as const, title: "Uy tín", description: null }, { icon: "clock" as const, title: "Nhanh", description: null }] };

const tabLabels = (container: HTMLElement) => within(within(container).getByRole("navigation", { name: /Mục lục dự án|Project contents/ })).getAllByRole("link");

describe("ProjectDetail (BL-052, design detail-du-an)", () => {
  it("dự án đủ khối: một h1, tab theo thứ tự design (Pháp lý + Chính sách gộp một tab), mỗi tab trỏ phần tử có thật, đủ h2, tài liệu trong Pháp lý", () => {
    const { container } = renderDetail(richProject);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Dự án Sông Sài Gòn" })).toBeInTheDocument();
    const links = tabLabels(container);
    expect(links.map((link) => link.textContent)).toEqual(["Tổng quan", "Vị trí", "Tiện ích", "Hình ảnh", "Mặt bằng", "Bảng giá", "Pháp lý & chính sách"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#overview", "#location", "#amenities", "#gallery", "#floor-plans", "#pricing", "#legal"]);
    for (const link of links) expect(container.querySelector(link.getAttribute("href")!), link.getAttribute("href")!).not.toBeNull();
    for (const name of ["Tổng quan dự án", "Vị trí dự án", "Tiện ích nổi bật", "Hình ảnh dự án", "Mặt bằng", "Bảng giá", "Pháp lý", "Chính sách bán hàng", "Nhận thông tin dự án"]) {
      expect(screen.getByRole("heading", { level: 2, name }), name).toBeInTheDocument();
    }
    for (const [id, eyebrow] of [["overview", "Giới thiệu"], ["location", "Kết nối"], ["amenities", "Không gian sống"], ["gallery", "Thư viện ảnh"]] as const) {
      expect(within(container.querySelector(`#${id}`) as HTMLElement).getByText(eyebrow)).toBeInTheDocument();
    }
    const legal = container.querySelector("#legal") as HTMLElement;
    expect(within(legal).getByRole("heading", { level: 3, name: "Tài liệu" })).toBeInTheDocument();
    expect(legal.querySelector("#documents")).not.toBeNull();
    expect(container.querySelector("#sales-policy")).not.toBeNull();
    expect(screen.getByText("Nội dung tổng quan")).toBeInTheDocument();
  });

  it("bố cục: mọi khối ở cột trái (thẻ trắng), cột phải dính tới hết lưới (BL-061); MỘT form #lead-form; Hotline Gọi ngay tel:", () => {
    const { container } = renderDetail(richProject);
    expect(container.querySelectorAll("#lead-form")).toHaveLength(1);
    expect(container.querySelectorAll("form")).toHaveLength(1);
    const aside = screen.getByRole("complementary", { name: "Nhận thông tin dự án" });
    const sticky = aside.firstElementChild as HTMLElement;
    expect(sticky.className).toContain("lg:sticky");
    expect(sticky.className).toContain("--detail-aside-h");
    expect(sticky.querySelector("#lead-form form")).not.toBeNull();
    expect(within(aside).getByRole("link", { name: "Gọi ngay 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    // Lưới [cột trái | aside]: cột trái có Tổng quan rồi mọi khối sau (BL-061), thẻ trắng, container query.
    const grid = aside.parentElement as HTMLElement;
    expect(grid.className).toContain("lg:grid-cols-");
    const column = grid.firstElementChild as HTMLElement;
    expect(column.getAttribute("data-section-style")).toBe("cards");
    expect(column).toHaveClass("@container/detail");
    expect(Array.from(column.querySelectorAll(":scope > section[id]")).map((section) => section.id)).toEqual(["overview"]);
    expect(container.querySelector("#overview")?.className).toContain("rounded-[20px]");
    // Các khối sau: mỗi khối một phần tử trong cột trái (thẻ trắng), không còn dải nền xen kẽ.
    const bands = Array.from(container.querySelectorAll<HTMLElement>("[data-detail-band]"));
    expect(bands.map((band) => band.querySelector("section[id]")?.id)).toEqual(["location", "amenities", "gallery", "floor-plans", "pricing", "legal"]);
    for (const band of bands) expect(column.contains(band)).toBe(true);
    expect(container.querySelector("#location")?.closest("[data-section-style]")).toBe(column);
    for (const id of ["overview", "location", "amenities", "gallery", "floor-plans", "pricing", "legal", "sales-policy"]) {
      expect(container.querySelector(`#${id}`)?.className, id).toContain("scroll-mt-[calc(var(--sticky-top)+4.5rem)]");
    }
    // CTA dính đáy < lg cuộn tới form duy nhất.
    for (const link of screen.getAllByRole("link", { name: "Nhận tư vấn" })) expect(link).toHaveAttribute("href", "#lead-form");
  });

  it("hero: ảnh 1 là LCP duy nhất, badge danh mục + tình trạng, địa chỉ, mô tả ngắn, nút video (link hợp lệ), Xem tất cả N ảnh, breadcrumb", () => {
    const { container } = renderDetail(richProject);
    const hero = container.querySelector("[data-detail-hero]") as HTMLElement;
    expect(hero.querySelector("img")?.getAttribute("src")).toContain("g1");
    expect(container.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(1);
    expect(within(hero).getByText("Căn hộ chung cư")).toBeInTheDocument();
    expect(within(hero).getByText("Đang mở bán")).toHaveAttribute("data-variant", "success");
    expect(within(hero).getByText("Hà Nội")).toBeInTheDocument();
    expect(within(hero).getByText("Mô tả ngắn")).toBeInTheDocument();
    expect(within(hero).getByRole("button", { name: "Xem video giới thiệu" })).toBeInTheDocument();
    expect(within(hero).getAllByRole("button", { name: "Xem tất cả 3 ảnh" }).length).toBeGreaterThan(0);
    expect(within(hero).getByRole("navigation", { name: /Breadcrumb|Đường dẫn/i })).toBeInTheDocument();
    // Không icon tim / không nút yêu thích.
    expect(container.querySelector('[aria-label*="thích"]')).toBeNull();
  });

  it("hero: link video ngoài whitelist → không nút video; Đã bàn giao dùng badge tối đọc được trên nền ảnh", () => {
    const { container } = renderDetail(baseProject({ videoUrl: "https://evil.example/video", salesStatus: "handed_over" }));
    const hero = container.querySelector("[data-detail-hero]") as HTMLElement;
    expect(within(hero).queryByRole("button", { name: "Xem video giới thiệu" })).toBeNull();
    expect(within(hero).getByText("Đã bàn giao")).toHaveAttribute("data-variant", "dark");
  });

  it("thanh thông số: Giá từ (min bảng giá > 0) · Quy mô ha · Diện tích · Chủ đầu tư · Bàn giao · Loại hình; không ô Pháp lý", () => {
    renderDetail(richProject);
    const bar = screen.getByRole("group", { name: "Thông số dự án" });
    const cells = within(bar).getAllByRole("term").map((term) => [term.textContent, term.nextElementSibling?.textContent]);
    expect(cells).toEqual([
      ["Giá từ", "3 tỷ"],
      ["Quy mô", "36,21 ha"],
      ["Diện tích", "50 – 120 m²"],
      ["Chủ đầu tư", "Vinhomes"],
      ["Bàn giao", "Quý 4/2027"],
      ["Loại hình", "Căn hộ, Biệt thự"],
    ]);
    expect(within(bar).queryByText("Pháp lý")).toBeNull();
  });

  it("thanh thông số: không bảng giá → priceFromVnd; không gì → Liên hệ, ô trống bị bỏ", () => {
    const { unmount } = renderDetail(fullProject);
    expect(within(screen.getByRole("group", { name: "Thông số dự án" })).getByText("3,5 tỷ")).toBeInTheDocument();
    unmount();
    renderDetail(baseProject());
    const bar = screen.getByRole("group", { name: "Thông số dự án" });
    expect(within(bar).getAllByRole("term").map((term) => term.textContent)).toEqual(["Giá từ"]);
    expect(within(bar).getByText("Liên hệ")).toBeInTheDocument();
  });

  it("Tổng quan: lưới thông tin (website chủ đầu tư là link ngoài an toàn, quy mô gộp) + thẻ Sản phẩm (số 0 coi như chưa nhập)", () => {
    const { container } = renderDetail(richProject);
    const overview = container.querySelector("#overview") as HTMLElement;
    const info = within(overview).getByLabelText("Thông tin dự án");
    const rows = within(info).getAllByRole("term").map((term) => [term.textContent, term.nextElementSibling?.textContent]);
    expect(rows).toEqual([
      ["Tên thương mại", "Dự án Sông Sài Gòn"],
      ["Chủ đầu tư", "Vinhomes (mở tab mới)"],
      ["Vị trí", "Hà Nội"],
      ["Quy mô", "36,21 ha · 1.200 căn · 4 tòa · 30 tầng"],
      ["Loại hình", "Căn hộ, Biệt thự"],
      ["Bàn giao", "Quý 4/2027"],
    ]);
    const link = within(info).getByRole("link", { name: /Vinhomes/ });
    expect(link).toHaveAttribute("href", "https://vinhomes.vn");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    const products = within(overview).getByRole("list", { name: "Sản phẩm của dự án" });
    expect(within(products).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["96Biệt thự đơn lập200 – 360 m²", "Shophouse xây thô90 m²"]);
  });

  it("Tổng quan (BL-071): lưới thông tin và thẻ Sản phẩm xếp dọc ở mọi bề rộng (không chia cột ≥ xl)", () => {
    const { container } = renderDetail(richProject);
    const overview = container.querySelector("#overview") as HTMLElement;
    const wrapper = within(overview).getByRole("list", { name: "Sản phẩm của dự án" }).parentElement as HTMLElement;
    expect(wrapper.className).not.toContain("xl:grid-cols");
    expect(within(wrapper).getByLabelText("Thông tin dự án")).toBeInTheDocument();
  });

  it("Tiện ích: ảnh tiện ích + 5 mục đầu (tên + mô tả), nút Khám phá tất cả tiện ích mở phần còn lại", async () => {
    const user = userEvent.setup();
    const { container } = renderDetail(richProject);
    const section = container.querySelector("#amenities") as HTMLElement;
    expect(section.querySelector("img")?.getAttribute("src")).toContain("am1");
    expect(within(section).getByText("Mô tả Hồ cảnh quan")).toBeInTheDocument();
    expect(within(section).getByText("Bể bơi").closest("li")).not.toBeVisible();
    const more = within(section).getByRole("button", { name: "Khám phá tất cả tiện ích" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await user.click(more);
    expect(within(section).getByText("Bể bơi").closest("li")).toBeVisible();
  });

  it("Hình ảnh: lưới mở lightbox + Xem tất cả hình ảnh; ảnh dưới màn đầu không preload", () => {
    const { container } = renderDetail(richProject);
    const gallery = container.querySelector("#gallery") as HTMLElement;
    expect(within(gallery).getByRole("button", { name: "Xem ảnh 1 / 3" })).toBeInTheDocument();
    expect(within(gallery).getByRole("button", { name: "Xem tất cả hình ảnh" })).toBeInTheDocument();
    expect(gallery.querySelector('img[fetchpriority="high"]')).toBeNull();
  });

  it("dự án tối thiểu (1 ảnh, không video / sản phẩm / tiện ích / bản đồ / pháp lý): chỉ tab Tổng quan, khối trống ẩn, mô tả ngắn thay tổng quan", () => {
    const { container } = renderDetail(baseProject({ gallery: [image("g1")] }), "vi", [], undefined, false);
    expect(tabLabels(container).map((link) => link.textContent)).toEqual(["Tổng quan"]);
    for (const id of ["location", "amenities", "gallery", "floor-plans", "pricing", "legal", "sales-policy", "faq", "related-listings"]) expect(container.querySelector(`#${id}`), id).toBeNull();
    expect(container.querySelector("[data-detail-band]")).toBeNull();
    expect(screen.queryByRole("button", { name: "Xem video giới thiệu" })).toBeNull();
    expect(screen.queryByRole("list", { name: "Sản phẩm của dự án" })).toBeNull();
    expect(screen.queryByRole("link", { name: /Gọi ngay/ })).toBeNull();
    expect(screen.getAllByText("Mô tả ngắn").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("#lead-form")).not.toBeNull();
  });

  it("mọi ảnh thư viện bị xoá → hero nền tối không ảnh, không khối Hình ảnh, vẫn đủ h1 + form", () => {
    const { container } = renderDetail(baseProject({ gallery: ["id-con", null as never] }));
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-detail-hero]")).not.toBeNull();
    expect(container.querySelector("#gallery")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Dự án Sông Sài Gòn" })).toBeInTheDocument();
    expect(container.querySelector("#lead-form")).not.toBeNull();
  });

  it("chỉ có Chính sách (không Pháp lý) → tab Chính sách trỏ #sales-policy, vẫn một dải", () => {
    const { container } = renderDetail(baseProject({ salesPolicy: fullProject.salesPolicy }));
    const links = tabLabels(container);
    expect(links.at(-1)).toHaveTextContent("Chính sách");
    expect(links.at(-1)).toHaveAttribute("href", "#sales-policy");
    expect(container.querySelectorAll("[data-detail-band]")).toHaveLength(2);
  });

  it("/en: nhãn tiếng Anh, không còn chữ Việt trong khung trang; ảnh thiếu alt dùng tên dự án EN", () => {
    const doc = baseProject({ title: "Saigon Riverside", gallery: [{ ...image("g1"), alt: "" }, image("g2"), image("g3")], documents: [pdf("d1", "Price list")], productTypes: ["apartment"], videoUrl: VIDEO });
    const { container } = renderDetail(doc, "en");
    expect(tabLabels(container).map((link) => link.textContent)).toEqual(["Overview", "Photos", "Legal"]);
    expect(screen.getByRole("heading", { level: 2, name: "Get project information" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Watch the intro video" })).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Project key facts" })).getByText("Apartment")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Nhận|Tổng quan|Tài liệu|Thư viện|Chia sẻ|Giá từ|Gọi ngay|Khoảng cách|Hình ảnh|Liên hệ/);
  });

  it("cuối trang: Dự án tương tự (thẻ h3, Xem tất cả dự án → /du-an) → dải Điểm mạnh (theo cờ) → banner tư vấn", () => {
    renderDetail(richProject, "vi", [
      { id: "r1", title: "Dự án B", href: "/du-an/b", salesStatus: "selling", provinceName: "Hà Nội", categoryName: null, cover: null, productTypes: [], priceFromLabel: null, areaRangeLabel: null, handoverTime: null, summary: null, address: null },
    ] as never[], undefined, true, strengths);
    const similar = screen.getByRole("heading", { level: 2, name: /Dự án tương tự/ }).closest("section") as HTMLElement;
    expect(within(similar).getByRole("heading", { level: 3, name: "Dự án B" })).toBeInTheDocument();
    expect(within(similar).getByRole("link", { name: "Xem tất cả dự án" })).toHaveAttribute("href", "/du-an");
    expect(similar.className).toContain("bg-primary-subtle");
    const strengthsRegion = screen.getByRole("heading", { level: 3, name: "Uy tín" }).closest("section") as HTMLElement;
    const banner = screen.getByTestId("consult-banner");
    expect(similar.compareDocumentPosition(strengthsRegion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(strengthsRegion.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("không có dự án khác / cờ Điểm mạnh tắt → không dựng hai khối đó", () => {
    renderDetail(fullProject);
    expect(screen.queryByRole("heading", { name: /Dự án tương tự/ })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Uy tín" })).toBeNull();
  });
});

const rentalCard = { id: "r1", title: "Căn 2PN view sông", href: "/cho-thue/can-2pn", code: "CT-1", priceMonthlyVnd: 12_000_000, areaM2: 70, bedrooms: 2, areaLabel: "Quận 1", cover: null };
const postCard = { id: "a1", title: "Ưu đãi tháng 10", href: "/tin-bds/uu-dai", excerpt: "Giảm 5%", publishedAt: null, dateLabel: null, categoryName: null, cover: null, priceLabel: null, badge: null, endLabel: null };

describe("ProjectDetail: Tin liên quan + CTA tham quan (BL-020 P4-T02)", () => {
  it("có cả hai nhóm: khối sau Tài liệu và trước Dự án khác, mục con 'Tin liên quan' → #related-listings, thẻ h3 là link tới tin", () => {
    const { container } = renderDetail(fullProject, "vi", [{ id: "d2", title: "Dự án B", href: "/du-an/b", salesStatus: "selling", provinceName: null, categoryName: null, cover: null, productTypes: [], priceFromLabel: null, areaRangeLabel: null, handoverTime: null, summary: null, address: null }] as never[], { rentals: [rentalCard], posts: [postCard] });
    const nav = screen.getByRole("navigation", { name: "Mục lục dự án" });
    const links = within(nav).getAllByRole("link");
    expect(links.at(-1)).toHaveTextContent("Tin liên quan");
    expect(links.at(-1)).toHaveAttribute("href", "#related-listings");
    const block = container.querySelector("#related-listings") as HTMLElement;
    expect(block.className).toContain("scroll-mt-[calc(var(--sticky-top)+4.5rem)]");
    expect(within(block).getByRole("heading", { level: 2, name: "Tin liên quan" })).toBeInTheDocument();
    expect(within(block).getByText("Cho thuê")).toBeInTheDocument();
    expect(within(block).getByText("Tin BĐS")).toBeInTheDocument();
    expect(within(block).getByRole("heading", { level: 3, name: "Căn 2PN view sông" }).closest("a")).toHaveAttribute("href", "/cho-thue/can-2pn");
    expect(within(block).getByRole("heading", { level: 3, name: "Ưu đãi tháng 10" }).closest("a")).toHaveAttribute("href", "/tin-bds/uu-dai");
    // Thẻ biến thể danh sách BL-052 (cùng thẻ trang /cho-thue, /tin-bds), không phải thẻ trang chủ (spec-validation r2 N3).
    expect([...block.querySelectorAll("[data-card-variant]")].map((card) => card.getAttribute("data-card-variant"))).toEqual(["listing", "listing"]);
    const similar = screen.getByRole("heading", { level: 2, name: /Dự án tương tự/ }).closest("section") as HTMLElement;
    expect(container.querySelector("#documents")!.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(block.compareDocumentPosition(similar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("chỉ một nhóm có tin → nhóm kia ẩn; cả hai trống → không khối, không mục con", () => {
    const { container, unmount } = renderDetail(fullProject, "vi", [], { rentals: [rentalCard], posts: [] });
    expect(screen.getByText("Cho thuê")).toBeInTheDocument();
    expect(screen.queryByText("Tin BĐS")).toBeNull();
    unmount();
    const empty = renderDetail(fullProject, "vi", [], { rentals: [], posts: [] });
    expect(empty.container.querySelector("#related-listings")).toBeNull();
    expect(screen.queryByRole("link", { name: "Tin liên quan" })).toBeNull();
    expect(container).toBeDefined();
  });

  it("/en: nhãn tiếng Anh cho khối, mục con và CTA", () => {
    renderDetail(fullProject, "en", [], { rentals: [rentalCard], posts: [] });
    expect(screen.getByRole("heading", { level: 2, name: "Related listings" })).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Project contents" })).getAllByRole("link").at(-1)).toHaveTextContent("Related listings");
  });

  it("banner tư vấn do trang truyền vào nằm cuối, sau Tin liên quan và Dự án tương tự; không nhân đôi form; ảnh mới không preload", () => {
    const { container } = renderDetail(fullProject, "vi", [{ id: "d2", title: "Dự án B", href: "/du-an/b", salesStatus: "selling", provinceName: null, categoryName: null, cover: null, productTypes: [], priceFromLabel: null, areaRangeLabel: null, handoverTime: null, summary: null, address: null }] as never[], { rentals: [{ ...rentalCard, cover: image("cover-r1") }], posts: [] });
    const banner = screen.getByTestId("consult-banner");
    const similar = screen.getByRole("heading", { level: 2, name: /Dự án tương tự/ }).closest("section") as HTMLElement;
    expect(container.querySelector("#related-listings")!.compareDocumentPosition(similar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(similar.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelectorAll("#lead-form")).toHaveLength(1);
    expect(container.querySelectorAll("form")).toHaveLength(1);
    expect(container.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(1);
  });

  it("không có dự án khác → không dựng khối Dự án tương tự", () => {
    renderDetail(fullProject, "vi", [], undefined);
    expect(screen.queryByRole("heading", { name: /Dự án tương tự/ })).toBeNull();
  });
});

describe("Documents", () => {
  it("link PDF mở tab mới an toàn, nhãn chứa tên file và dung lượng", () => {
    const view = toProjectDetailView(baseProject({ documents: [pdf("a", "Bảng giá"), pdf("b", "Brochure")] }), "vi");
    renderWithIntl(<Documents documents={view.documents} />);
    const link = screen.getByRole("link", { name: "Tải tài liệu: Bảng giá (PDF, mở tab mới)" });
    expect(link).toHaveAttribute("href", "/api/media/file/a.pdf");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getAllByText("PDF · 1 MB")).toHaveLength(2);
  });

  it("không có tài liệu thì không render", () => {
    const { container } = renderWithIntl(<Documents documents={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("DetailSubNav", () => {
  const items = [
    { id: "overview", label: "Tổng quan" },
    { id: "location", label: "Vị trí" },
  ];

  function renderNav() {
    document.body.insertAdjacentHTML("beforeend", '<section id="overview" tabindex="-1"></section><section id="location" tabindex="-1"></section>');
    return renderWithIntl(<DetailSubNav items={items} label="Mục lục dự án" />);
  }

  afterEach(() => {
    document.getElementById("overview")?.remove();
    document.getElementById("location")?.remove();
  });

  it("mục đầu mặc định aria-current=location; IntersectionObserver đổi mục đang xem", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "Vị trí" })).not.toHaveAttribute("aria-current");
    act(() => observerCallback?.([{ target: { id: "location" }, isIntersecting: true }]));
    expect(screen.getByRole("link", { name: "Vị trí" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "Tổng quan" })).not.toHaveAttribute("aria-current");
  });

  it("bấm cuộn tới khối: mượt mặc định, tức thì khi giảm chuyển động; chuyển focus vào khối, cập nhật hash, link tối thiểu 44px", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal("matchMedia", matchMedia);
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole("link", { name: "Vị trí" }));
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth", block: "start" });
    expect(document.activeElement?.id).toBe("location");
    expect(window.location.hash).toBe("#location");
    matchMedia.mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    await user.click(screen.getByRole("link", { name: "Tổng quan" }));
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: "auto", block: "start" });
    expect(screen.getByRole("link", { name: "Vị trí" }).className).toContain("min-h-11");
    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("sticky");
    // Viên thuốc dính dưới header nổi: nav trong suốt không chặn click, viên thuốc (ul) mới nhận chuột.
    expect(nav.className).toContain("top-(--sticky-top)");
    expect(nav.className).toContain("pointer-events-none");
    expect(within(nav).getByRole("list").className).toContain("rounded-pill");
    // BL-028: bề rộng thanh = khung nội dung bên dưới (cùng max-w-container + px-gutter với lưới), không ôm vừa nút.
    expect(nav.className).toContain("max-w-container");
    expect(nav.className).toContain("px-gutter");
    const list = within(nav).getByRole("list");
    expect(list.className).toContain("w-full");
    expect(list.className).not.toContain("w-fit");
    expect(screen.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "location");
  });

  it("mục đang xem tô nền primary + chữ primary-foreground; nhãn nav lấy từ prop", () => {
    renderNav();
    expect(screen.getByRole("navigation", { name: "Mục lục dự án" })).toBeInTheDocument();
    const active = screen.getByRole("link", { name: "Tổng quan" });
    expect(active.className).toContain("bg-primary");
    expect(active.className).toContain("text-primary-foreground");
    expect(screen.getByRole("link", { name: "Vị trí" }).className).not.toContain("bg-primary");
  });
});

describe("LegalPolicy (accordion < lg)", () => {
  const blocks = [
    { id: "legal", title: "Pháp lý", content: <p>Nội dung pháp lý</p> },
    { id: "sales-policy", title: "Chính sách bán hàng", content: <p>Nội dung chính sách</p> },
  ];

  it("mở sẵn mục đầu, mục sau đóng nhưng vẫn nằm trong HTML; bấm để mở; heading h2 bọc nút", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LegalPolicy blocks={blocks} />);
    const legal = screen.getByRole("button", { name: "Pháp lý" });
    const policy = screen.getByRole("button", { name: "Chính sách bán hàng" });
    expect(legal).toHaveAttribute("aria-expanded", "true");
    expect(policy).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Nội dung pháp lý")).toBeVisible();
    const panel = screen.getByText("Nội dung chính sách").closest("div");
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel?.className).toContain("max-lg:hidden");
    expect(legal.closest("h2")).not.toBeNull();
    expect(legal.className).toContain("min-h-11");
    await user.click(policy);
    expect(policy).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Nội dung chính sách").closest("div")?.className).not.toContain("max-lg:hidden");
  });

  it(">= lg: tiêu đề là chữ thường (không nút), nội dung luôn hiện", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    renderWithIntl(<LegalPolicy blocks={blocks} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Chính sách bán hàng" })).toBeInTheDocument();
    expect(screen.getByText("Nội dung chính sách").closest("div")).not.toHaveAttribute("hidden");
  });

  it("HTML server: không dùng thuộc tính hidden (Tailwind v4 !important thắng lg:), cột 2 chỉ ẩn bằng max-lg:hidden nên ≥ lg hiện đủ hai cột không cần JS", async () => {
    const { renderToString } = await import("react-dom/server");
    const { NextIntlClientProvider } = await import("next-intl");
    const html = renderToString(
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <LegalPolicy blocks={blocks} />
      </NextIntlClientProvider>,
    );
    expect(html).not.toMatch(/\shidden(=|\s|>)/);
    expect(html).toContain('class="pt-6 max-lg:hidden"');
    expect(html).toContain('class="pt-6"');
  });

  it("mở trang kèm #sales-policy thì mở đúng mục đó (mobile)", async () => {
    window.history.replaceState(null, "", "#sales-policy");
    renderWithIntl(<LegalPolicy blocks={blocks} />);
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Chính sách bán hàng" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Nội dung chính sách").closest("div")?.className).not.toContain("max-lg:hidden");
    window.history.replaceState(null, "", "#");
  });

  it("bấm \"Chính sách\" trên thanh mục con (hashchange) mở mục tương ứng", async () => {
    const user = userEvent.setup();
    Element.prototype.scrollIntoView = vi.fn();
    renderWithIntl(
      <>
        <DetailSubNav items={[{ id: "legal", label: "Pháp lý" }, { id: "sales-policy", label: "Chính sách" }]} label="Mục lục dự án" />
        <LegalPolicy blocks={blocks} />
      </>,
    );
    expect(screen.getByRole("button", { name: "Chính sách bán hàng" })).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("link", { name: "Chính sách" }));
    expect(screen.getByRole("button", { name: "Chính sách bán hàng" })).toHaveAttribute("aria-expanded", "true");
    window.history.replaceState(null, "", "#");
  });
});

describe("LegalPolicy neo phụ #documents", () => {
  const blocks = [
    { id: "legal", title: "Pháp lý", content: <p>Nội dung pháp lý</p> },
    { id: "sales-policy", anchorIds: ["documents"], title: "Chính sách bán hàng", content: <p id="documents">Tài liệu</p> },
  ];

  it("link #documents mở khối đang thu gọn rồi cuộn tới (cả lần bấm lặp lại cùng hash)", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderWithIntl(
      <>
        <a href="#documents">Tải tài liệu</a>
        <LegalPolicy blocks={blocks} />
      </>,
    );
    const toggle = screen.getByRole("button", { name: "Chính sách bán hàng" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("link", { name: "Tải tài liệu" }));
    await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("link", { name: "Tải tài liệu" }));
    await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(2));
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", "#");
  });

  it("giảm chuyển động: cuộn không mượt", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduced-motion"), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    renderWithIntl(
      <>
        <a href="#documents">Tải tài liệu</a>
        <LegalPolicy blocks={blocks} />
      </>,
    );
    await user.click(screen.getByRole("link", { name: "Tải tài liệu" }));
    await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" }));
    window.history.replaceState(null, "", "#");
  });
});

describe("FloorPlans", () => {
  const plans = (count: number) =>
    toProjectDetailView(baseProject({ floorPlans: Array.from({ length: count }, (_, index) => ({ title: `Căn ${index + 1}PN`, image: image(`f${index}`) })) }), "vi").floorPlans;

  it("tab theo tên, ← → Home End đổi mặt bằng (roving tabindex), ảnh có alt; bấm ảnh mở lightbox", async () => {
    const user = userEvent.setup();
    renderWithIntl(<FloorPlans plans={plans(3)} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Căn 1PN", "Căn 2PN", "Căn 3PN"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");
    tabs[0]?.focus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(tabs[1]);
    await user.keyboard("{End}");
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", tabs[0]?.id);
    expect(screen.queryByRole("combobox")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Phóng to mặt bằng Căn 1PN" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it(">= 6 mặt bằng: có ô chọn cho mobile dùng chung state với tab", async () => {
    const user = userEvent.setup();
    renderWithIntl(<FloorPlans plans={plans(6)} />);
    const select = screen.getByRole("combobox", { name: "Chọn mặt bằng" });
    expect(select.parentElement?.className).toContain("md:hidden");
    expect(screen.getByRole("tablist").className).toContain("hidden md:flex");
    await chooseOption(user, select, "Căn 4PN");
    expect(screen.getAllByRole("tab", { hidden: true })[3]).toHaveAttribute("aria-selected", "true");
  });
});

describe("ProjectStickyCta", () => {
  it("hiện khi form chưa trong viewport và đặt --sticky-cta-height; ẩn + gỡ biến khi form vào viewport", () => {
    document.body.insertAdjacentHTML("beforeend", '<section id="lead-form"></section>');
    renderWithIntl(<ProjectStickyCta />);
    const bar = screen.getByRole("link", { name: "Nhận tư vấn" });
    expect(bar).toHaveAttribute("href", "#lead-form");
    expect(bar.parentElement?.className).toContain("fixed");
    expect(bar.parentElement?.className).toContain("lg:hidden");
    expect(bar.parentElement?.className).toContain("env(safe-area-inset-bottom");
    expect(bar.parentElement?.className).toContain("var(--floating-bottom-offset,0px)");
    expect(document.documentElement.style.getPropertyValue("--sticky-cta-height")).toBe("calc(64px + env(safe-area-inset-bottom, 0px))");
    act(() => observerCallback?.([{ target: { id: "lead-form" }, isIntersecting: true }]));
    expect(screen.queryByRole("link", { name: "Nhận tư vấn" })).toBeNull();
    expect(document.documentElement.style.getPropertyValue("--sticky-cta-height")).toBe("");
    document.getElementById("lead-form")?.remove();
  });
});
