import { describe, expect, it } from "vitest";
import type { Category, Homepage, Media, Project, PropertyPost, Service } from "../../payload-types";
import { buildHomeView, type HomeDocs, visibleBlockKeys } from "./home-view";

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

  it("visibleBlockKeys: rentals/news có trong blockOrder và đã bật vẫn chưa hiện (giao diện làm ở P2-T03/T04); homepage cũ thiếu khối mới vẫn render như cũ", () => {
    const order = ["rentals", "about", "news"].map((block) => ({ block })) as Homepage["blockOrder"];
    const page = homepage({ blockOrder: order, rentals: { enabled: true, title: "Cho thuê" }, news: { enabled: true, title: "Tin tức" } });
    expect(visibleBlockKeys(page)).toEqual(["about"]);
    expect(visibleBlockKeys(homepage()).length).toBeGreaterThan(0);
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
