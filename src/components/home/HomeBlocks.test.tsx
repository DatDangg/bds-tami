import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { buildHomeView, type HomeDocs } from "@/lib/home/home-view";
import type { Category, Homepage, Media, News, Project, PropertyPost, Service } from "@/payload-types";
import { HomeBlocks } from "./HomeBlocks";

const NOW = new Date("2026-10-18T03:00:00.000Z");
const stamp = "2026-01-01T00:00:00.000Z";

const media = (id: string): Media =>
  ({ id, alt: `Ảnh ${id}`, url: `/api/media/file/${id}.jpg`, width: 1600, mimeType: "image/jpeg", sizes: { card: { url: `/api/media/file/${id}-800.webp`, width: 800 } }, updatedAt: stamp, createdAt: stamp }) as Media;
const category: Category = { id: "c1", name: "Căn hộ", slug: "can-ho", scope: "project", hasEnglish: true, updatedAt: stamp, createdAt: stamp };

const docs: HomeDocs = {
  projects: [1, 2, 3].map((n) => ({ id: `p${n}`, title: `Dự án ${n}`, slug: `du-an-${n}`, summary: `Tóm tắt ${n}`, salesStatus: "selling", category, gallery: [media(`pg${n}`)] }) as Project),
  services: [1, 2, 3].map((n) => ({ id: `s${n}`, title: `Dịch vụ ${n}`, slug: `dich-vu-${n}`, summary: "Mô tả", coverImage: media(`sv${n}`) }) as Service),
  offers: [{ id: "o1", title: "Voucher 1", slug: "voucher-1", excerpt: "Ưu đãi", cover: media("oc1") } as PropertyPost],
  chipProjects: [],
  provinces: [],
  rentalCategories: [],
  rentalTabs: [],
  news: [],
};

const richText = {
  root: { type: "root", version: 1, children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text: "Giới thiệu TAMI." }] }] },
} as unknown as NonNullable<Homepage["about"]>["content"];

const homepage = (overrides: Partial<Homepage> = {}): Homepage =>
  ({
    id: "h",
    hero: { slides: [{ id: "s1", image: media("hero"), title: "Tiêu đề hero", subtitle: "Phụ đề", ctaLabel: "Xem dự án", ctaLink: "projects" }] },
    about: { enabled: true, title: "Về TAMI", content: richText, image: media("about"), stats: [{ value: "10+", label: "năm kinh nghiệm" }] },
    featuredProjects: { enabled: true, title: "Dự án nổi bật" },
    services: { enabled: true, title: "Dịch vụ của TAMI" },
    featuredOffers: { enabled: true, title: "Ưu đãi nổi bật" },
    partners: { enabled: true, title: "Đối tác" },
    ctaBanner: { enabled: true, title: "Cần tư vấn?", description: "Để lại thông tin", ctaLabel: "", ctaLink: null },
    blockOrder: ["about", "featuredProjects", "services", "featuredOffers", "partners", "ctaBanner"].map((block) => ({ block })) as Homepage["blockOrder"],
    ...overrides,
  }) as Homepage;

const renderHome = (page: Homepage, locale: "vi" | "en" = "vi", content: HomeDocs = docs) =>
  renderWithIntl(<HomeBlocks view={buildHomeView(page, content, locale, NOW)} siteName="TAMI HOMES" />, locale);

/** BL-101: nút xem thêm mọi khối dùng chung ghost + mũi tên →. */
const expectMoreLink = (link: HTMLElement) => {
  expect(link).toHaveAttribute("data-variant", "ghost");
  expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
};
/** BL-101: đầu khối căn giữa kèm gạch trang trí. */
const expectCenteredHeading = (heading: HTMLElement) => {
  expect(heading.parentElement).toHaveClass("items-center", "text-center");
  expect(heading.nextElementSibling).toHaveClass("h-0.5", "w-12", "bg-primary");
};

/** Tiêu đề h2 của các khối theo thứ tự trong DOM. */
const blockHeadings = () => screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);

describe("HomeBlocks: đầu khối + nút xem thêm đồng bộ (BL-101)", () => {
  it("Dự án / Dịch vụ / Ưu đãi: h2 căn giữa kèm gạch; nút Xem thêm / Xem tất cả cùng ghost + mũi tên", () => {
    renderHome(homepage());
    for (const name of ["Dự án nổi bật", "Dịch vụ của TAMI", "Ưu đãi nổi bật"]) expectCenteredHeading(screen.getByRole("heading", { level: 2, name }));
    expectMoreLink(screen.getByRole("link", { name: "Xem tất cả dự án" }));
    expectMoreLink(screen.getByRole("link", { name: "Xem thêm" }));
  });
});

describe("HomeBlocks: thứ tự và bật/tắt khối", () => {
  it("render theo blockOrder mặc định: hero, Về TAMI, dự án, dịch vụ, ưu đãi, CTA (đối tác chưa có giao diện)", () => {
    renderHome(homepage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tiêu đề hero");
    expect(blockHeadings()).toEqual(["Về TAMI", "Dự án nổi bật", "Dịch vụ của TAMI", "Ưu đãi nổi bật", "Cần tư vấn?"]);
  });

  it("đổi blockOrder → đúng thứ tự mới; hero luôn đứng đầu", () => {
    const { container } = renderHome(homepage({ blockOrder: [{ block: "ctaBanner" }, { block: "featuredOffers" }, { block: "about" }] as Homepage["blockOrder"] }));
    expect(blockHeadings()).toEqual(["Cần tư vấn?", "Ưu đãi nổi bật", "Về TAMI"]);
    expect(container.children[1]).toHaveAttribute("aria-roledescription", "carousel");
  });

  it("tắt khối (enabled=false) → không render khối đó", () => {
    renderHome(homepage({ services: { enabled: false, title: "Dịch vụ của TAMI" }, featuredOffers: { enabled: false, title: "Ưu đãi nổi bật" } }));
    expect(blockHeadings()).toEqual(["Về TAMI", "Dự án nổi bật", "Cần tư vấn?"]);
    expect(screen.queryByText("Dịch vụ 1")).toBeNull();
  });

  it("ctaBanner tắt (mặc định) → không có banner", () => {
    renderHome(homepage({ ctaBanner: { enabled: false, title: "Cần tư vấn?" } }));
    expect(screen.queryByText("Cần tư vấn?")).toBeNull();
  });
});

describe("HomeBlocks: nội dung khối", () => {
  it("Về TAMI: nội dung richText và số liệu trong <dl>", () => {
    renderHome(homepage());
    expect(screen.getByText("Giới thiệu TAMI.")).toBeInTheDocument();
    expect(screen.getByText("10+").tagName).toBe("DD");
    expect(screen.getByText("năm kinh nghiệm").tagName).toBe("DT");
  });

  it("dự án: thẻ là một link tới trang dự án kèm badge trạng thái; có điều khiển khi ≥ 2 dự án", () => {
    renderHome(homepage());
    const region = screen.getByRole("region", { name: "Dự án nổi bật" });
    expect(within(region).getAllByText("Đang mở bán")).toHaveLength(3);
    expect(within(region).getAllByRole("link", { name: /Dự án 1/ })[0]).toHaveAttribute("href", "/du-an/du-an-1");
    expect(within(region).getByRole("button", { name: "Chuyển tới dự án 3" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem tất cả dự án" })).toHaveAttribute("href", "/du-an");
    expect(screen.getByRole("link", { name: "Xem thêm" })).toHaveAttribute("href", "/tin-bds");
  });

  it("1 dự án: không điều khiển", () => {
    renderHome(homepage(), "vi", { ...docs, projects: docs.projects.slice(0, 1) });
    expect(screen.queryByRole("button", { name: /Chuyển tới dự án/ })).toBeNull();
  });

  it("dịch vụ: mỗi thẻ là một link tới /dich-vu/[slug]; ưu đãi: thẻ link tới tin", () => {
    renderHome(homepage());
    expect(screen.getByRole("link", { name: /Dịch vụ 2/ })).toHaveAttribute("href", "/dich-vu/dich-vu-2");
    expect(screen.getByRole("link", { name: /Voucher 1/ })).toHaveAttribute("href", "/tin-bds/voucher-1");
  });

  it("CTA 'Nhận tư vấn' mặc định → /lien-he; ctaLink đặt thì theo ctaLink", () => {
    const first = renderHome(homepage());
    expect(screen.getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "/lien-he");
    first.unmount();
    renderHome(homepage({ ctaBanner: { enabled: true, title: "Cần tư vấn?", ctaLabel: "Gọi ngay", ctaLink: "https://zalo.me/tami" } }));
    expect(screen.getByRole("link", { name: "Gọi ngay" })).toHaveAttribute("href", "https://zalo.me/tami");
  });

  it("trang luôn có đúng một h1 ẩn: tiêu đề slide 1, không có thì tên site (kể cả không hero); nằm ngoài carousel", () => {
    const { unmount } = renderHome(homepage({ hero: { slides: [{ id: "s1", image: media("hero") }] } }));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("TAMI HOMES");
    unmount();
    const second = renderHome(homepage({ hero: { slides: [{ id: "s1", image: media("hero"), title: "Căn hộ cho thuê cao cấp" }] } }));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Căn hộ cho thuê cao cấp");
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("sr-only");
    second.unmount();
    renderHome(homepage({ hero: { slides: [] } }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("TAMI HOMES");
  });

  it("hero kéo lên dưới header nổi bằng đúng khoảng header chiếm (--header-offset)", () => {
    renderHome(homepage());
    const hero = screen.getByRole("region", { name: "Nổi bật" });
    expect(hero).not.toHaveAttribute("data-header-hero");
    expect(hero).toHaveClass("-mt-(--header-offset)", "h-svh");
  });
});

describe("HomeBlocks: truy cập", () => {
  it("h1 vẫn nằm trong cây truy cập khi carousel chuyển sang slide khác (không nằm trong slide bị aria-hidden/inert)", () => {
    renderHome(
      homepage({ hero: { slides: [1, 2].map((n) => ({ id: `s${n}`, image: media(`h${n}`), title: `Hero ${n}`, ctaLabel: "Xem", ctaLink: "projects" })) } }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Chuyển tới slide 2" }));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hero 1");
  });

  it("dịch vụ ≥ 4 mục: hàng cuộn focus được có tên truy cập là tiêu đề khối", () => {
    const services = [1, 2, 3, 4].map((n) => ({ id: `s${n}`, title: `Dịch vụ ${n}`, slug: `dich-vu-${n}`, summary: "Mô tả", coverImage: media(`sv${n}`) }) as Service);
    renderHome(homepage(), "vi", { ...docs, services });
    expect(screen.getByRole("list", { name: "Dịch vụ của TAMI" })).toHaveAttribute("tabindex", "0");
  });
});

describe("HomeBlocks: /en không lấy chữ Việt", () => {
  const enPage = (overrides: Partial<Homepage> = {}) =>
    homepage({
      hero: { slides: [{ id: "s1", image: media("hero"), title: "Curated real estate", ctaLabel: "View projects", ctaLink: "projects" }] },
      about: { enabled: true, title: "About TAMI", content: richText, stats: [] },
      featuredProjects: { enabled: true, title: "Featured projects" },
      services: { enabled: true, title: null },
      featuredOffers: { enabled: true, title: "Featured offers" },
      ctaBanner: { enabled: true, title: null, description: null, ctaLabel: null, ctaLink: null },
      ...overrides,
    });

  it("ctaBanner thiếu title EN → ẩn; khối thiếu tiêu đề EN → ẩn; link theo ngôn ngữ", () => {
    renderHome(enPage(), "en");
    expect(blockHeadings()).toEqual(["About TAMI", "Featured projects", "Featured offers"]);
    expect(screen.queryByText("Get advice")).toBeNull();
    expect(screen.getByRole("link", { name: "View projects" })).toHaveAttribute("href", "/en/projects");
  });

  it("có title EN thì ctaBanner hiện với nút mặc định 'Get advice' → /en/contact", () => {
    renderHome(enPage({ ctaBanner: { enabled: true, title: "Need advice?" } }), "en");
    expect(screen.getByRole("link", { name: "Get advice" })).toHaveAttribute("href", "/en/contact");
  });
});

describe("HomeBlocks: thanh thông báo + ô tìm kiếm hero (BL-020)", () => {
  const withChips: HomeDocs = { ...docs, chipProjects: docs.projects.slice(0, 2) };

  it("trang chủ không còn tự render thanh thông báo (nằm ở PublicShell, trên header)", () => {
    renderHome(homepage({ announcementBar: { enabled: true, text: "Mở bán đợt 2", link: "projects" } }));
    expect(screen.queryByRole("region", { name: "Thông báo" })).toBeNull();
  });

  it("ô tìm kiếm đứng ngay sau hero: form q → /cho-thue, chip dự án; ảnh hero vẫn ưu tiên (LCP)", () => {
    const { container } = renderHome(homepage(), "vi", withChips);
    expect(container.children[1]).toHaveAttribute("aria-roledescription", "carousel");
    const search = screen.getByRole("region", { name: "Tìm kiếm nhanh" });
    expect(container.children[2]).toBe(search);
    expect(search.querySelector("form")).toHaveAttribute("action", "/cho-thue");
    expect(within(search).getByRole("link", { name: "Dự án 1" })).toHaveAttribute("href", "/du-an/du-an-1");
    expect(container.querySelector("section[aria-roledescription=carousel] img")).toHaveAttribute("fetchpriority", "high");
  });

  it("/en: form tới /en/for-rent; tắt ô tìm kiếm → không render", () => {
    const en = renderHome(homepage({ hero: { slides: [{ id: "s1", image: media("hero"), title: "Hero EN" }] }, heroSearch: { enabled: true } }), "en", withChips);
    expect(screen.getByRole("region", { name: "Quick search" }).querySelector("form")).toHaveAttribute("action", "/en/for-rent");
    en.unmount();
    renderHome(homepage({ heroSearch: { enabled: false } }), "vi", withChips);
    expect(screen.queryByRole("region", { name: "Tìm kiếm nhanh" })).toBeNull();
  });
});

describe("HomeBlocks: Cho thuê + Tin tức (BL-020)", () => {
  const rentalItem = (id: string) => ({
    id,
    code: `CT-${id}`,
    title: `Căn hộ ${id}`,
    slug: `can-ho-${id}`,
    status: "published" as const,
    thumbnail: null,
    priceMonthlyVnd: 9_000_000,
    priceNegotiable: false,
    areaM2: 40,
    bedrooms: 1,
    bathrooms: 1,
    furnishing: null,
    province: { name: "TP.HCM", slug: "tp-hcm" },
    ward: { name: "Phường 1", slug: "phuong-1" },
    category: null,
    publishedAt: null,
  });
  const marketDocs: HomeDocs = {
    ...docs,
    rentalTabs: [{ category: { id: "rc1", name: "Thuê nhà ở", slug: "nha-o" }, items: [rentalItem("1")] }],
    news: [1, 2, 3].map((n) => ({ id: `n${n}`, title: `Bài ${n}`, slug: `bai-${n}`, excerpt: "Tóm tắt", cover: media(`n${n}`) }) as News),
  };
  const marketPage = (order: string[], overrides: Partial<Homepage> = {}) =>
    homepage({
      rentals: { enabled: true, title: "Thuê nhà" },
      news: { enabled: true, title: "Tin tức", intro: "Giới thiệu tin" },
      blockOrder: order.map((block) => ({ block })) as Homepage["blockOrder"],
      ...overrides,
    });

  it("render theo blockOrder: Cho thuê và Tin tức xen giữa các khối khác", () => {
    renderHome(marketPage(["about", "rentals", "featuredOffers", "news"]), "vi", marketDocs);
    expect(blockHeadings()).toEqual(["Về TAMI", "Thuê nhà", "Ưu đãi nổi bật", "Tin tức"]);
    expect(screen.getByRole("link", { name: /Căn hộ 1/ })).toHaveAttribute("href", "/cho-thue/can-ho-1");
    expect(screen.getByRole("link", { name: "Xem tất cả" })).toHaveAttribute("href", "/tin-tuc");
    expect(screen.getByText("Giới thiệu tin")).toBeInTheDocument();
  });

  it("homepage chưa có hai khối trong blockOrder (bản ghi cũ) → không hiện, dù có dữ liệu", () => {
    renderHome(marketPage(["about", "featuredOffers"]), "vi", marketDocs);
    expect(blockHeadings()).toEqual(["Về TAMI", "Ưu đãi nổi bật"]);
    expect(screen.queryByText("Thuê nhà")).toBeNull();
  });

  it("tắt khối hoặc không có dữ liệu → ẩn khối", () => {
    renderHome(marketPage(["about", "rentals", "news"], { rentals: { enabled: false, title: "Thuê nhà" } }), "vi", { ...marketDocs, news: [] });
    expect(blockHeadings()).toEqual(["Về TAMI"]);
  });
});

describe("HomeBlocks: Điểm mạnh + hero hai dòng (BL-044)", () => {
  const strengthsPage = (overrides: Partial<Homepage> = {}) =>
    homepage({
      hero: { eyebrow: "TAMI HOMES", caption: "Kết nối mọi hành trình", slides: [{ id: "s1", image: media("hero"), title: "Căn hộ cho thuê", titleAccent: "sẵn sàng vào ở" }] },
      strengths: {
        enabled: true,
        items: [
          { icon: "map-pin", title: "Vị trí đắc địa", description: "Kết nối thuận tiện" },
          { icon: "buildings", title: "Căn hộ đa dạng", description: "Phù hợp mọi nhu cầu" },
          { icon: "headset", title: "Hỗ trợ chuyên nghiệp", description: null },
          { icon: "file-check", title: "Thủ tục nhanh gọn", description: "Sẵn sàng vào ở" },
        ],
      },
      blockOrder: ["strengths", "about", "featuredProjects", "ctaBanner"].map((block) => ({ block })) as Homepage["blockOrder"],
      ...overrides,
    });

  it("khối Điểm mạnh ngay sau ô tìm kiếm: vùng có aria-label, 4 mục h3 + mô tả, không h2; h1 duy nhất = tiêu đề + dòng vàng slide 1", () => {
    const { container } = renderHome(strengthsPage());
    const region = screen.getByRole("region", { name: "Điểm mạnh" });
    expect(container.children[3]).toBe(region);
    expect(within(region).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Vị trí đắc địa", "Căn hộ đa dạng", "Hỗ trợ chuyên nghiệp", "Thủ tục nhanh gọn"]);
    expect(within(region).queryByRole("heading", { level: 2 })).toBeNull();
    expect(within(region).getByText("Kết nối thuận tiện").tagName).toBe("P");
    expect(region.querySelectorAll("svg")).toHaveLength(4);
    expect(blockHeadings()).toEqual(["Về TAMI", "Dự án nổi bật", "Cần tư vấn?"]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Căn hộ cho thuê sẵn sàng vào ở");
    expect(screen.getByText("Kết nối mọi hành trình")).toBeInTheDocument();
  });

  it("/en: mục chưa dịch bị bỏ, còn ≥ 2 mục vẫn hiện; tắt khối → không render", () => {
    const en = renderHome(
      strengthsPage({
        hero: { slides: [{ id: "s1", image: media("hero"), title: "Ready to move in" }] },
        about: { enabled: true, title: "About" },
        strengths: {
          enabled: true,
          items: [
            { icon: "map-pin", title: "Prime location" },
            { icon: "buildings", title: null as never },
            { icon: "headset", title: "Expert support" },
          ],
        },
      }),
      "en",
    );
    expect(within(screen.getByRole("region", { name: "Why TAMI" })).getAllByRole("heading", { level: 3 })).toHaveLength(2);
    en.unmount();
    renderHome(strengthsPage({ strengths: { enabled: false, items: [] } }));
    expect(screen.queryByRole("region", { name: "Điểm mạnh" })).toBeNull();
  });
});

describe("HomeBlocks: banner CTA ảnh tràn viền + 2 nút (BL-020 #7)", () => {
  it("có `ctaBanner.image` + nút phụ → ảnh lazy, scrim, nút phụ chip theo link; EN dùng link /en", () => {
    const cta = { enabled: true, title: "Đăng ký tham quan", image: media("cta"), secondaryLabel: "Đặt lịch tham quan", secondaryLink: "projects" } as Homepage["ctaBanner"];
    const { container } = renderHome(homepage({ ctaBanner: cta }));
    expect(container.querySelector('img[src*="cta"]')).toHaveAttribute("loading", "lazy");
    expect(screen.getByTestId("cta-scrim")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đặt lịch tham quan" })).toHaveAttribute("href", "/du-an");
    expect(screen.getByRole("link", { name: "Đặt lịch tham quan" })).toHaveAttribute("data-variant", "chip");
    expect(screen.getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("data-variant", "primary");
  });

  it("không ảnh, thiếu link nút phụ → khối tối chỉ một nút như cũ", () => {
    renderHome(homepage({ ctaBanner: { enabled: true, title: "Cần tư vấn?", secondaryLabel: "Đặt lịch tham quan", secondaryLink: null } }));
    expect(screen.queryByTestId("cta-scrim")).toBeNull();
    expect(screen.queryByRole("link", { name: "Đặt lịch tham quan" })).toBeNull();
  });
});
