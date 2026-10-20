import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chooseOption, fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { toProjectDetailView } from "@/lib/projects/project-detail-view";
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

function renderDetail(doc: Project, locale: Locale = "vi", related = [] as never[], listings?: { rentals: unknown[]; posts: unknown[] }, withHotline = true) {
  return renderWithIntl(
    <ProjectDetail
      doc={doc}
      view={toProjectDetailView(doc, locale)}
      related={related}
      {...(listings ? { listings: listings as never } : {})}
      {...(withHotline ? { hotline: { label: "0901 234 567", telHref: "tel:0901234567" } } : {})}
      ownPath={locale === "vi" ? "/du-an/song-sai-gon" : "/en/projects/saigon-riverside"}
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

describe("ProjectDetail (S03)", () => {
  it("dự án đủ khối: đúng một h1, các section có tên, thứ tự mục con theo spec, tài liệu và form có mặt", () => {
    const { container } = renderDetail(fullProject);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Dự án Sông Sài Gòn" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Mục lục dự án" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Tổng quan", "Vị trí", "Tiện ích", "Mặt bằng", "Pháp lý", "Chính sách", "Thư viện"]);
    expect(within(nav).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "#overview", "#location", "#amenities", "#floor-plans", "#legal", "#sales-policy", "#gallery",
    ]);
    for (const name of ["Tổng quan", "Vị trí", "Tiện ích", "Mặt bằng", "Pháp lý", "Chính sách bán hàng", "Thư viện ảnh", "Nhận thông tin dự án"]) {
      expect(screen.getByRole("heading", { level: 2, name: new RegExp(name) }), name).toBeInTheDocument();
    }
    // Tài liệu nằm TRONG khối Pháp lý (h3 dưới h2 Pháp lý), neo #documents cho nút hero vẫn có thật.
    const legal = container.querySelector("#legal") as HTMLElement;
    expect(within(legal).getByRole("heading", { level: 3, name: "Tài liệu" })).toBeInTheDocument();
    expect(legal.querySelector("#documents")).not.toBeNull();
    // Mỗi neo của thanh mục con trỏ tới phần tử có thật.
    for (const link of within(nav).getAllByRole("link")) expect(container.querySelector(link.getAttribute("href")!), link.getAttribute("href")!).not.toBeNull();
    expect(screen.getByText("Nội dung tổng quan")).toBeInTheDocument();
    expect(screen.getByText("Sổ hồng lâu dài")).toBeInTheDocument();
    expect(screen.getByText("Chiết khấu 5%")).toBeInTheDocument();
  });

  it("bố cục 2 cột: form lead chỉ MỘT bản (một id) nằm trong aside cùng thẻ Tư vấn dính; hotline là link tel:; mục con không bị che (scroll-mt gồm thanh)", () => {
    const { container } = renderDetail(fullProject);
    expect(container.querySelectorAll("#lead-form")).toHaveLength(1);
    expect(container.querySelectorAll("form")).toHaveLength(1);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.className).not.toContain("font-normal"); // BL-036: weight 500 mặc định từ token text-display
    expect(h1.className).not.toContain("uppercase");
    const aside = container.querySelector("aside") as HTMLElement;
    expect(aside).not.toBeNull();
    const card = aside.querySelector("#lead-form") as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.contains(aside.querySelector("form"))).toBe(true);
    expect(card.className).toContain("lg:sticky");
    expect(card.className).not.toMatch(/max-h|overflow-y/);
    expect(card.className).toContain("--detail-aside-h");
    expect(within(aside).getByRole("link", { name: "0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    // Cột chính và aside là hai cột của cùng một lưới ≥ lg; aside không nằm trong cột chính.
    const grid = aside.parentElement as HTMLElement;
    expect(grid.className).toContain("lg:grid-cols-");
    expect(grid.firstElementChild?.contains(aside)).toBe(false);
    // Khung dùng chung (BL-027): gốc đánh dấu trang chi tiết; cột chính là MỘT thẻ trắng bo lớn chứa các khối; thẻ Tư vấn dính theo --sticky-top.
    expect(container.querySelector("[data-detail-page]")).not.toBeNull();
    expect(grid.firstElementChild?.className).toContain("bg-surface");
    expect(grid.firstElementChild?.className).toContain("rounded-[28px]");
    expect(grid.firstElementChild?.querySelector("#overview")).not.toBeNull();
    expect(card.className).toContain("--sticky-top)_+_4.5rem");
    // Thẻ Tư vấn (đích #lead-form) ghi đè scroll-mt mặc định của LeadFormSlot để pill dính không che tiêu đề (M-1).
    expect(card.className).toContain("scroll-mt-[calc(var(--sticky-top)+4.5rem)]");
    expect(aside.getAttribute("aria-labelledby")).toBe(card.querySelector("h2")?.id);
    for (const id of ["overview", "location", "amenities", "floor-plans", "gallery", "legal", "sales-policy"]) {
      expect(container.querySelector(`#${id}`)?.className, id).toContain("scroll-mt-[calc(var(--sticky-top)+4.5rem)]");
    }
  });

  it("hero: ảnh đầu tải ưu tiên (LCP) và là ảnh duy nhất được preload; nút Nhận tư vấn → #lead-form, Tải tài liệu → #documents", () => {
    const { container } = renderDetail(fullProject);
    const hero = container.querySelector("section img") as HTMLImageElement;
    expect(hero.getAttribute("src")).toContain("g1");
    expect(hero).toHaveAttribute("fetchpriority", "high");
    expect(container.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(1);
    // Hero + thanh dính đáy mobile: cả hai cuộn tới form.
    for (const link of screen.getAllByRole("link", { name: "Nhận tư vấn" })) expect(link).toHaveAttribute("href", "#lead-form");
    expect(screen.getByRole("link", { name: "Tải tài liệu" })).toHaveAttribute("href", "#documents");
    expect(container.querySelector("#lead-form")).not.toBeNull();
  });

  it("thiếu floorPlans/tiện ích/pháp lý/chính sách/tài liệu → ẩn khối và mục con tương ứng, không lỗi", () => {
    const { container } = renderDetail(baseProject());
    for (const name of ["Mặt bằng", "Tiện ích", "Pháp lý", "Chính sách bán hàng", "Tài liệu"]) {
      expect(screen.queryByRole("heading", { name }), name).toBeNull();
    }
    const nav = screen.getByRole("navigation", { name: "Mục lục dự án" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Tổng quan", "Thư viện"]);
    expect(screen.queryByRole("link", { name: "Tải tài liệu" })).toBeNull();
    expect(container.querySelector("#floor-plans")).toBeNull();
    // Không có overview thì tổng quan hiện mô tả ngắn.
    expect(screen.getByText("Mô tả ngắn")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("mọi ảnh thư viện bị xoá → hero nền tối (không ảnh), không khối thư viện, vẫn đủ h1 + form", () => {
    const { container } = renderDetail(baseProject({ gallery: ["id-con", null as never] }));
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Thư viện ảnh" })).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Dự án Sông Sài Gòn" })).toBeInTheDocument();
    expect(container.querySelector("#lead-form")).not.toBeNull();
  });

  it("thông số: lưới dl có chủ đầu tư là link ngoài an toàn, quy mô, diện tích, giá từ, bàn giao", () => {
    const developer = { id: "dv", name: "Vinhomes", website: "https://vinhomes.vn", updatedAt: now, createdAt: now };
    const { container } = renderDetail({ ...fullProject, developer } as Project);
    const specs = container.querySelector("dl") as HTMLElement;
    expect(specs).toHaveAttribute("aria-label", "Thông số dự án");
    expect(within(specs).getByText("Quy mô").nextElementSibling).toHaveTextContent("1.200 căn · 4 tòa · 30 tầng");
    expect(within(specs).getByText("Diện tích").nextElementSibling).toHaveTextContent("50 – 120 m²");
    expect(within(specs).getByText("Giá từ").nextElementSibling).toHaveTextContent("3,5 tỷ");
    expect(within(specs).getByText("Bàn giao").nextElementSibling).toHaveTextContent("Quý 4/2027");
    const link = within(specs).getByRole("link", { name: /Vinhomes/ });
    expect(link).toHaveAttribute("href", "https://vinhomes.vn");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("/en: nhãn tiếng Anh, không còn chữ Việt trong khung trang; ảnh thiếu alt dùng tên dự án EN", () => {
    const doc = baseProject({ title: "Saigon Riverside", gallery: [{ ...image("g1"), alt: "" }, image("g2"), image("g3")], documents: [pdf("d1", "Price list")] });
    const { container } = renderDetail(doc, "en");
    const nav = screen.getByRole("navigation", { name: "Project contents" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Overview", "Legal", "Gallery"]);
    expect(screen.getByRole("link", { name: "Download documents" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Get project information" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Nhận|Tổng quan|Tài liệu|Thư viện/);
  });

  it("form lead: có hotline làm lối liên hệ tạm; dự án khác (nếu có) dùng h3", () => {
    renderDetail(fullProject, "vi", [
      { id: "r1", title: "Dự án B", href: "/du-an/b", salesStatus: "selling", provinceName: "Hà Nội", categoryName: null, priceFrom: null, cover: null },
    ] as never[]);
    expect(screen.getByRole("link", { name: "0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    const related = screen.getByRole("heading", { level: 2, name: "Dự án khác" }).closest("section") as HTMLElement;
    expect(within(related).getByRole("heading", { level: 3, name: "Dự án B" })).toBeInTheDocument();
  });
});

const rentalCard = { id: "r1", title: "Căn 2PN view sông", href: "/cho-thue/can-2pn", code: "CT-1", priceMonthlyVnd: 12_000_000, areaM2: 70, bedrooms: 2, areaLabel: "Quận 1", cover: null };
const postCard = { id: "a1", title: "Ưu đãi tháng 10", href: "/tin-bds/uu-dai", excerpt: "Giảm 5%", publishedAt: null, dateLabel: null, categoryName: null, cover: null, priceLabel: null, badge: null, endLabel: null };

describe("ProjectDetail: Tin liên quan + CTA tham quan (BL-020 P4-T02)", () => {
  it("có cả hai nhóm: khối sau Tài liệu và trước Dự án khác, mục con 'Tin liên quan' → #related-listings, thẻ h3 là link tới tin", () => {
    const { container } = renderDetail(fullProject, "vi", [{ id: "d2", title: "Dự án B", href: "/du-an/b", salesStatus: "selling", provinceName: null, categoryName: null, priceFrom: null, cover: null }] as never[], { rentals: [rentalCard], posts: [postCard] });
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
    const order = [...container.querySelectorAll("#documents, #related-listings, #related-projects")].map((node) => node.id);
    expect(order).toEqual(["documents", "related-listings", "related-projects"]);
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
    expect(screen.getByRole("heading", { level: 2, name: "Book a site visit" })).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Project contents" })).getAllByRole("link").at(-1)).toHaveTextContent("Related listings");
  });

  it("CTA 'Đăng ký tham quan' ở cuối trang: nút → #lead-form, nút phụ gọi hotline (tel:); không nhân đôi form; ảnh mới không preload", () => {
    const { container } = renderDetail(fullProject, "vi", [], { rentals: [{ ...rentalCard, cover: image("cover-r1") }], posts: [] });
    const cta = screen.getByRole("heading", { level: 2, name: "Đăng ký tham quan" }).closest("section") as HTMLElement;
    expect(within(cta).getByRole("link", { name: "Đăng ký tham quan" })).toHaveAttribute("href", "#lead-form");
    expect(within(cta).getByRole("link", { name: "Gọi hotline: 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    expect(container.querySelectorAll("#lead-form")).toHaveLength(1);
    expect(container.querySelectorAll("form")).toHaveLength(1);
    const relatedProjects = container.querySelector("#related-projects");
    // Chưa có dự án khác trong ca này: CTA vẫn là khối cuối trước thanh dính, sau khối Tin liên quan.
    expect(relatedProjects).toBeNull();
    expect(container.querySelector("#related-listings")!.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(1);
  });

  it("CTA không có hotline → chỉ nút chính", () => {
    renderDetail(fullProject, "vi", [], undefined, false);
    const cta = screen.getByRole("heading", { level: 2, name: "Đăng ký tham quan" }).closest("section") as HTMLElement;
    expect(within(cta).getAllByRole("link")).toHaveLength(1);
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
