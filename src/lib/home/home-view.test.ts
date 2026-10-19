import { describe, expect, it } from "vitest";
import type { Category, Homepage, Media, News, Project, PropertyPost, Province, Service } from "../../payload-types";
import type { RentalCard as RentalSearchCard } from "../../shared/types/api";
import { buildAnnouncementView, buildHomeView, type HomeDocs, visibleBlockKeys } from "./home-view";
import type { HomeRentalTabDocs } from "./home-view-listings";

const NOW = new Date("2026-10-18T03:00:00.000Z");
const stamp = "2026-01-01T00:00:00.000Z";

const media = (id: string, extra: Record<string, unknown> = {}): Media =>
  ({ id, alt: `Ảnh ${id}`, url: `/api/media/file/${id}.jpg`, width: 1600, mimeType: "image/jpeg", uploadedBy: "staff-secret", updatedAt: stamp, createdAt: stamp, ...extra }) as Media;

const category: Category = { id: "c1", name: "Căn hộ", slug: "can-ho", scope: "project", hasEnglish: true, updatedAt: stamp, createdAt: stamp };

const project = (id: string, extra: Partial<Project> = {}): Project =>
  ({ id, title: `Dự án ${id}`, slug: `du-an-${id}`, summary: `Tóm tắt ${id}`, salesStatus: "selling", category, gallery: [media(`g${id}`)], ...extra }) as Project;
const service = (id: string): Service => ({ id, title: `Dịch vụ ${id}`, slug: `dich-vu-${id}`, summary: "Mô tả", coverImage: media(`s${id}`) }) as Service;
const post = (id: string, extra: Partial<PropertyPost> = {}): PropertyPost =>
  ({ id, title: `Tin ${id}`, slug: `tin-${id}`, excerpt: "Tóm tắt", cover: media(`c${id}`), ...extra }) as PropertyPost;

const homepage = (overrides: Partial<Homepage> = {}): Homepage =>
  ({
    id: "h",
    hero: { slides: [{ id: "s1", image: media("hero1"), title: "Tiêu đề", subtitle: "Phụ đề", ctaLabel: "Xem dự án", ctaLink: "projects" }] },
    about: { enabled: true, title: "Về TAMI", stats: [{ value: "10+", label: "năm" }] },
    featuredProjects: { enabled: true, title: "Dự án nổi bật" },
    services: { enabled: true, title: "Dịch vụ" },
    featuredOffers: { enabled: true, title: "Ưu đãi" },
    partners: { enabled: true, title: "Đối tác" },
    ctaBanner: { enabled: true, title: "Cần tư vấn?", description: "Để lại thông tin", ctaLabel: "", ctaLink: null },
    blockOrder: ["about", "featuredProjects", "services", "featuredOffers", "partners", "ctaBanner"].map((block) => ({ block })) as Homepage["blockOrder"],
    ...overrides,
  }) as Homepage;

const docs = (overrides: Partial<HomeDocs> = {}): HomeDocs => ({
  projects: [project("1"), project("2")],
  services: [service("1"), service("2"), service("3")],
  offers: [post("1")],
  chipProjects: [],
  provinces: [],
  rentalTabs: [],
  news: [],
  ...overrides,
});

const kinds = (page: Homepage, d: HomeDocs = docs(), locale: "vi" | "en" = "vi") => buildHomeView(page, d, locale, NOW).blocks.map((block) => block.kind);

describe("buildHomeView: thứ tự và bật/tắt khối", () => {
  it("theo blockOrder; partners chưa có giao diện nên bị bỏ qua", () => {
    expect(kinds(homepage())).toEqual(["about", "featuredProjects", "services", "featuredOffers", "ctaBanner"]);
    const reordered = homepage({ blockOrder: [{ block: "ctaBanner" }, { block: "services" }, { block: "about" }] });
    expect(kinds(reordered)).toEqual(["ctaBanner", "services", "about"]);
  });

  it("khối không nằm trong blockOrder thì không hiện; thiếu blockOrder (cài mới) thì thứ tự mặc định; trùng chỉ tính một lần", () => {
    expect(kinds(homepage({ blockOrder: [{ block: "about" }, { block: "about" }] }))).toEqual(["about"]);
    expect(kinds(homepage({ blockOrder: null }))).toEqual(["about", "featuredProjects", "services", "featuredOffers", "ctaBanner"]);
  });

  it("tắt khối (enabled=false) thì không render; ctaBanner mặc định tắt khi chưa đặt", () => {
    expect(kinds(homepage({ about: { enabled: false, title: "Về TAMI" }, services: { enabled: false, title: "Dịch vụ" } }))).toEqual([
      "featuredProjects",
      "featuredOffers",
      "ctaBanner",
    ]);
    expect(kinds(homepage({ ctaBanner: { title: "Cần tư vấn?" } }))).not.toContain("ctaBanner");
  });

  it("khối danh sách rỗng (không còn bản ghi hiển thị được) thì ẩn cả khối", () => {
    expect(kinds(homepage(), docs({ projects: [], offers: [] }))).toEqual(["about", "services", "ctaBanner"]);
  });

  it("visibleBlockKeys: chỉ khối bật, có giao diện và có tiêu đề (quyết định truy vấn nào cần chạy)", () => {
    expect(visibleBlockKeys(homepage({ services: { enabled: false, title: "Dịch vụ" } }))).toEqual(["about", "featuredProjects", "featuredOffers", "ctaBanner"]);
  });

  it("visibleBlockKeys: rentals/news hiện theo blockOrder khi đã bật + có tiêu đề; homepage cũ thiếu khối mới (không có trong blockOrder) vẫn render như cũ", () => {
    const order = ["rentals", "about", "news"].map((block) => ({ block })) as Homepage["blockOrder"];
    const page = homepage({ blockOrder: order, rentals: { enabled: true, title: "Cho thuê" }, news: { enabled: true, title: "Tin tức" } });
    expect(visibleBlockKeys(page)).toEqual(["rentals", "about", "news"]);
    expect(visibleBlockKeys({ ...page, news: { enabled: false, title: "Tin tức" } })).toEqual(["rentals", "about"]);
    // Tiêu đề CMS tuỳ chọn cho hai khối này (có chữ mặc định theo ngôn ngữ): thiếu tiêu đề KHÔNG ẩn khối.
    expect(visibleBlockKeys({ ...page, rentals: { enabled: true, title: " " } })).toEqual(["rentals", "about", "news"]);
    expect(visibleBlockKeys(homepage())).not.toContain("rentals");
  });
});

describe("buildHomeView: /en không lấy chữ Việt", () => {
  const enPage = (overrides: Partial<Homepage> = {}) =>
    homepage({
      hero: { slides: [{ id: "s1", image: media("hero1"), title: "Title", subtitle: null, ctaLabel: null, ctaLink: null }] },
      about: { enabled: true, title: "About", stats: [{ value: "10+", label: null as never }] },
      featuredProjects: { enabled: true, title: null },
      services: { enabled: true, title: "Services" },
      featuredOffers: { enabled: true, title: "Offers" },
      ctaBanner: { enabled: true, title: null, description: null, ctaLabel: null, ctaLink: null },
      ...overrides,
    });

  it("ctaBanner thiếu title EN → ẩn; khối thiếu tiêu đề EN → ẩn; khối có chữ EN vẫn hiện", () => {
    expect(kinds(enPage(), docs(), "en")).toEqual(["about", "services", "featuredOffers"]);
    expect(kinds(enPage({ ctaBanner: { enabled: true, title: "Need advice?" } }), docs(), "en")).toContain("ctaBanner");
  });

  it("slide chưa có title EN bị bỏ; stat chưa có nhãn EN bị bỏ", () => {
    const page = enPage({
      hero: {
        slides: [
          { id: "s1", image: media("hero1"), title: null, subtitle: "Phụ đề VI?" },
          { id: "s2", image: media("hero2"), title: "Second" },
        ],
      },
    });
    const view = buildHomeView(page, docs(), "en", NOW);
    expect(view.hero.map((slide) => slide.title)).toEqual(["Second"]);
    const about = view.blocks.find((block) => block.kind === "about");
    expect(about && "stats" in about ? about.stats : null).toEqual([]);
  });

  it("ở vi slide chỉ có ảnh vẫn hiện; tiêu đề trống (race 2 admin) → CTA ẩn", () => {
    const page = homepage({ hero: { slides: [{ id: "s1", image: media("hero1") }] }, ctaBanner: { enabled: true, title: "  " } });
    const view = buildHomeView(page, docs(), "vi", NOW);
    expect(view.hero).toHaveLength(1);
    expect(view.blocks.map((block) => block.kind)).not.toContain("ctaBanner");
  });
});

describe("buildHomeView: hero", () => {
  it("CTA: link khoá trang theo ngôn ngữ; thiếu nhãn hoặc link sai → không có nút", () => {
    const slide = (ctaLabel: string, ctaLink: string) => ({ id: "s", image: media("h"), title: "T", ctaLabel, ctaLink });
    const hrefOf = (ctaLabel: string, ctaLink: string, locale: "vi" | "en") =>
      buildHomeView(homepage({ hero: { slides: [slide(ctaLabel, ctaLink)] } }), docs(), locale, NOW).hero[0]?.ctaHref;
    expect(hrefOf("Xem", "projects", "vi")).toBe("/du-an");
    expect(hrefOf("View", "projects", "en")).toBe("/en/projects");
    expect(hrefOf("", "projects", "vi")).toBeNull();
    expect(hrefOf("Xem", "javascript:alert(1)", "vi")).toBeNull();
  });

  it("video: chỉ MP4/WebM đã populate; slide không có ảnh dùng được bị bỏ; không lọt trường nội bộ của media", () => {
    const page = homepage({
      hero: {
        slides: [
          { id: "a", image: media("a"), video: media("v", { url: "/api/media/file/v.mp4", mimeType: "video/mp4" }), title: "A" },
          { id: "b", image: media("b"), video: media("p", { mimeType: "application/pdf" }), title: "B" },
          { id: "c", image: "chi-con-id", title: "C" },
        ],
      },
    });
    const view = buildHomeView(page, docs(), "vi", NOW);
    expect(view.hero.map((slide) => [slide.id, slide.videoUrl])).toEqual([
      ["a", "/api/media/file/v.mp4"],
      ["b", null],
    ]);
    expect(JSON.stringify(view)).not.toContain("staff-secret");
  });

  it("dự án: số liệu từ scale.* sẵn có; thiếu/không dương/chỉ khoảng trắng → null (thẻ ẩn ô)", () => {
    const full = project("1", { salesStatus: "upcoming", scale: { landAreaM2: 12000, totalUnits: 350, handoverTime: " Q4/2027 " } });
    const empty = project("2", { scale: { landAreaM2: 0, totalUnits: null, handoverTime: "  " } });
    const none = project("3");
    const block = buildHomeView(homepage(), docs({ projects: [full, empty, none] }), "vi", NOW).blocks.find((item) => item.kind === "featuredProjects");
    const slides = block && "slides" in block ? block.slides : [];
    expect(slides.map((slide) => [slide.salesStatus, slide.stats])).toEqual([
      ["upcoming", { landAreaM2: 12000, totalUnits: 350, handoverTime: "Q4/2027" }],
      ["selling", { landAreaM2: null, totalUnits: null, handoverTime: null }],
      ["selling", { landAreaM2: null, totalUnits: null, handoverTime: null }],
    ]);
  });
});

describe("buildHomeView: nội dung khối", () => {
  it("dự án: eyebrow là loại hình, ảnh là ảnh đầu thư viện, không lọt trường nội bộ; dự án thiếu slug bị bỏ", () => {
    const view = buildHomeView(homepage(), docs({ projects: [project("1"), project("2", { slug: null as never })] }), "vi", NOW);
    const block = view.blocks.find((item) => item.kind === "featuredProjects");
    expect(block && "slides" in block ? block.slides.map((slide) => [slide.title, slide.eyebrow, slide.image?.url, slide.href]) : null).toEqual([
      ["Dự án 1", "Căn hộ", "/api/media/file/g1.jpg", "/du-an/du-an-1"],
    ]);
    expect(JSON.stringify(view)).not.toContain("staff-secret");
  });

  it("ưu đãi: bài đã kết thúc không lên trang chủ (nguồn isOfferEnded)", () => {
    const ended = post("old", { offer: { endAt: "2026-10-01T05:00:00.000Z" } });
    const live = post("new", { offer: { endAt: "2026-10-30T05:00:00.000Z" } });
    const block = buildHomeView(homepage(), docs({ offers: [ended, live] }), "vi", NOW).blocks.find((item) => item.kind === "featuredOffers");
    expect(block && "cards" in block ? block.cards.map((card) => card.title) : null).toEqual(["Tin new"]);
  });

  it("CTA: link mặc định /lien-he, theo ngôn ngữ; ctaLink tuỳ chỉnh; nhãn trống → null (dùng chuỗi mặc định)", () => {
    const cta = (page: Homepage, locale: "vi" | "en") => buildHomeView(page, docs(), locale, NOW).blocks.find((item) => item.kind === "ctaBanner");
    expect(cta(homepage(), "vi")).toMatchObject({ href: "/lien-he", label: null, description: "Để lại thông tin" });
    expect(cta(homepage(), "en")).toMatchObject({ href: "/en/contact" });
    expect(cta(homepage({ ctaBanner: { enabled: true, title: "T", ctaLabel: "Gọi", ctaLink: "https://zalo.me/x" } }), "vi")).toMatchObject({ href: "https://zalo.me/x", label: "Gọi" });
  });

  it("dịch vụ: ảnh bìa chỉ còn trường công khai", () => {
    const block = buildHomeView(homepage(), docs(), "vi", NOW).blocks.find((item) => item.kind === "services");
    expect(block && "items" in block ? block.items.map((item) => item.cover?.url) : null).toEqual([
      "/api/media/file/s1.jpg",
      "/api/media/file/s2.jpg",
      "/api/media/file/s3.jpg",
    ]);
  });
});

describe("buildHomeView: thanh thông báo (BL-020)", () => {
  const bar = (overrides: Partial<NonNullable<Homepage["announcementBar"]>> = {}) => homepage({ announcementBar: { enabled: true, text: "  Mở bán đợt 2  ", link: "projects", ...overrides } });
  const announcement = (page: Homepage, locale: "vi" | "en" = "vi") => buildAnnouncementView(page, locale);

  it("tắt (mặc định) hoặc chưa cấu hình → không có thanh", () => {
    expect(announcement(homepage())).toBeNull();
    expect(announcement(bar({ enabled: false }))).toBeNull();
    expect(announcement(bar({ enabled: null }))).toBeNull();
  });

  it("bật nhưng chữ trống/khoảng trắng (kể cả /en chưa có bản dịch) → ẩn, không lấy chữ Việt", () => {
    expect(announcement(bar({ text: "   " }))).toBeNull();
    expect(announcement(bar({ text: null }), "en")).toBeNull();
  });

  it("bật có chữ: cắt khoảng trắng, link theo ngôn ngữ, link sai → chỉ chữ; hash đổi theo chữ/link", () => {
    const vi = announcement(bar());
    expect(vi).toMatchObject({ text: "Mở bán đợt 2", href: "/du-an", external: false });
    expect(announcement(bar({ text: "Open now" }), "en")).toMatchObject({ href: "/en/projects" });
    expect(announcement(bar({ link: "javascript:alert(1)" }))).toMatchObject({ href: null, external: false });
    expect(announcement(bar({ link: "https://ex.test/x" }))).toMatchObject({ href: "https://ex.test/x", external: true });
    expect(announcement(bar({ text: "Khác" }))?.hash).not.toBe(vi?.hash);
    expect(announcement(bar({ link: "rentals" }))?.hash).not.toBe(vi?.hash);
  });
});

describe("buildHomeView: ô tìm kiếm hero (BL-020)", () => {
  const view = (page: Homepage, chipProjects: Project[], locale: "vi" | "en" = "vi") => buildHomeView(page, docs({ chipProjects }), locale, NOW).heroSearch;

  it("mặc định bật; enabled=false → null", () => {
    expect(view(homepage(), [])).toMatchObject({ placeholder: null, chips: [] });
    expect(view(homepage({ heroSearch: { enabled: false } }), [project("1")])).toBeNull();
  });

  it("đích form theo ngôn ngữ; placeholder CMS được cắt khoảng trắng, trống → null (dùng chữ mặc định)", () => {
    expect(view(homepage({ heroSearch: { enabled: true, placeholder: " Tìm căn hộ " } }), [])).toMatchObject({ placeholder: "Tìm căn hộ", rentalsHref: "/cho-thue", projectsHref: "/du-an" });
    expect(view(homepage({ heroSearch: { enabled: true, placeholder: "" } }), [], "en")).toMatchObject({ placeholder: null, rentalsHref: "/en/for-rent", projectsHref: "/en/projects" });
  });

  it("tỉnh/thành cho ô lọc tab Dự án: slug + tên ngắn nếu có", () => {
    const provinces = [
      { id: "1", slug: "ha-noi", name: "Thành phố Hà Nội", shortName: "Hà Nội" },
      { id: "2", slug: "tp-hcm", name: "TP.HCM" },
    ] as Province[];
    const search = buildHomeView(homepage(), docs({ provinces }), "vi", NOW).heroSearch;
    expect(search?.provinces).toEqual([
      { slug: "ha-noi", name: "Hà Nội" },
      { slug: "tp-hcm", name: "TP.HCM" },
    ]);
  });

  it("chip: giữ thứ tự, link chi tiết dự án theo ngôn ngữ, bỏ dự án thiếu tên/slug", () => {
    const chips = view(homepage(), [project("2"), project("x", { slug: "" }), project("1")])?.chips;
    expect(chips).toEqual([
      { id: "2", title: "Dự án 2", href: "/du-an/du-an-2" },
      { id: "1", title: "Dự án 1", href: "/du-an/du-an-1" },
    ]);
    expect(view(homepage(), [project("1")], "en")?.chips[0]?.href).toBe("/en/projects/du-an-1");
  });
});

const rentalDto = (id: string, extra: Partial<RentalSearchCard> = {}): RentalSearchCard => ({
  id,
  code: `CT-${id}`,
  title: `Căn hộ ${id}`,
  slug: `can-ho-${id}`,
  status: "published",
  thumbnail: { url: `/api/media/file/r${id}.webp`, alt: null },
  priceMonthlyVnd: 9_000_000,
  priceNegotiable: false,
  areaM2: 40,
  bedrooms: 1,
  bathrooms: 1,
  furnishing: null,
  province: { name: "TP.HCM", slug: "tp-hcm" },
  ward: { name: "Phường 1", slug: "phuong-1" },
  publishedAt: null,
  ...extra,
});
const tab = (slug: string, ids: string[], name = `Danh mục ${slug}`): HomeRentalTabDocs => ({ category: { id: `c-${slug}`, name, slug }, items: ids.map((id) => rentalDto(id)) });
const newsDoc = (id: string, extra: Partial<News> = {}): News =>
  ({ id, title: `Bài ${id}`, slug: `bai-${id}`, excerpt: "Tóm tắt", publishedAt: "2026-10-01T00:00:00.000Z", cover: media(`n${id}`), ...extra }) as News;
const marketPage = (overrides: Partial<Homepage> = {}) =>
  homepage({
    blockOrder: ["news", "rentals"].map((block) => ({ block })) as Homepage["blockOrder"],
    rentals: { enabled: true, title: "Thuê nhà" },
    news: { enabled: true, title: "Tin tức", intro: "  Giới thiệu  " },
    ...overrides,
  });

describe("buildHomeView: khối Cho thuê (BL-020 #8)", () => {
  const rentalsOf = (page: Homepage, d: HomeDocs, locale: "vi" | "en" = "vi") => {
    const block = buildHomeView(page, d, locale, NOW).blocks.find((item) => item.kind === "rentals");
    return block?.kind === "rentals" ? block : null;
  };

  it("mỗi tab: nhãn danh mục, link danh mục theo ngôn ngữ, thẻ từ DTO của SearchService; giữ thứ tự tab", () => {
    const block = rentalsOf(marketPage(), docs({ rentalTabs: [tab("can-ho", ["1", "2"]), tab("mat-bang", ["3"])] }));
    expect(block?.title).toBe("Thuê nhà");
    expect(block?.tabs.map((item) => [item.label, item.href, item.cards.length])).toEqual([
      ["Danh mục can-ho", "/cho-thue/danh-muc/can-ho", 2],
      ["Danh mục mat-bang", "/cho-thue/danh-muc/mat-bang", 1],
    ]);
    expect(block?.tabs[0]?.cards[0]).toMatchObject({ title: "Căn hộ 1", href: "/cho-thue/can-ho-1" });
    expect(rentalsOf(marketPage(), docs({ rentalTabs: [tab("can-ho", ["1"])] }), "en")?.tabs[0]?.href).toBe("/en/for-rent/category/can-ho");
  });

  it("giới hạn: ≤ 8 tin mỗi tab, ≤ 4 tab", () => {
    const ids = Array.from({ length: 12 }, (_, index) => String(index));
    const many = ["a", "b", "c", "d", "e"].map((slug) => tab(slug, ids));
    const block = rentalsOf(marketPage(), docs({ rentalTabs: many }));
    expect(block?.tabs).toHaveLength(4);
    expect(block?.tabs.every((item) => item.cards.length === 8)).toBe(true);
  });

  it("bỏ tab không có tin hoặc danh mục thiếu tên/slug; không còn tab nào → ẩn cả khối", () => {
    const kept = rentalsOf(marketPage(), docs({ rentalTabs: [tab("rong", []), tab("", ["1"]), tab("can-ho", ["2"], "  "), tab("ok", ["3"])] }));
    expect(kept?.tabs.map((item) => item.label)).toEqual(["Danh mục ok"]);
    expect(rentalsOf(marketPage(), docs({ rentalTabs: [tab("rong", [])] }))).toBeNull();
    expect(rentalsOf(marketPage(), docs())).toBeNull();
  });

  it("tắt khối hoặc không có trong blockOrder → không hiện; thiếu tiêu đề CMS (kể cả /en) vẫn hiện với title rỗng để dùng chữ mặc định", () => {
    const d = docs({ rentalTabs: [tab("can-ho", ["1"])] });
    expect(rentalsOf(marketPage({ rentals: { enabled: false, title: "Thuê nhà" } }), d)).toBeNull();
    expect(rentalsOf(marketPage({ rentals: { enabled: true, title: "" } }), d, "en")?.title).toBe("");
    expect(rentalsOf(marketPage({ rentals: { enabled: true } }), d)?.tabs).toHaveLength(1);
    expect(rentalsOf(marketPage({ blockOrder: [{ block: "about" }] }), d)).toBeNull();
  });
});

describe("buildHomeView: khối Tin tức (BL-020 #11)", () => {
  const newsOf = (page: Homepage, d: HomeDocs, locale: "vi" | "en" = "vi") => {
    const block = buildHomeView(page, d, locale, NOW).blocks.find((item) => item.kind === "news");
    return block?.kind === "news" ? block : null;
  };

  it("tiêu đề + intro (cắt khoảng trắng), thẻ theo thứ tự, link Xem tất cả theo ngôn ngữ; ≤ 3 bài", () => {
    const block = newsOf(marketPage(), docs({ news: ["1", "2", "3", "4"].map((id) => newsDoc(id)) }));
    expect(block).toMatchObject({ title: "Tin tức", intro: "Giới thiệu", href: "/tin-tuc" });
    expect(block?.posts.map((post) => post.title)).toEqual(["Bài 1", "Bài 2", "Bài 3"]);
    expect(block?.posts[0]?.href).toBe("/tin-tuc/bai-1");
    expect(newsOf(marketPage(), docs({ news: [newsDoc("1")] }), "en")).toMatchObject({ href: "/en/news" });
  });

  it("intro trống → null; bài thiếu tiêu đề/slug bị bỏ; không còn bài → ẩn khối", () => {
    expect(newsOf(marketPage({ news: { enabled: true, title: "Tin tức", intro: " " } }), docs({ news: [newsDoc("1")] }))?.intro).toBeNull();
    expect(newsOf(marketPage(), docs({ news: [newsDoc("1", { slug: "" }), newsDoc("2")] }))?.posts).toHaveLength(1);
    expect(newsOf(marketPage(), docs({ news: [newsDoc("1", { title: "" })] }))).toBeNull();
    expect(newsOf(marketPage(), docs())).toBeNull();
  });

  it("thứ tự theo blockOrder (tin tức đứng trước cho thuê) và tắt khối thì ẩn", () => {
    const d = docs({ rentalTabs: [tab("can-ho", ["1"])], news: [newsDoc("1")] });
    expect(kinds(marketPage(), d)).toEqual(["news", "rentals"]);
    expect(kinds(marketPage({ news: { enabled: false, title: "Tin tức" } }), d)).toEqual(["rentals"]);
  });
});
