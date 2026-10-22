import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { StrengthsView } from "@/lib/home/home-view";
import { toPostDetailSpecs } from "@/lib/posts/post-detail-specs";
import { toPostCards, toPostDetailView, toPostOfferView, type RelatedDocs } from "@/lib/posts/post-view";
import type { Category, Media, Project, PropertyPost } from "@/payload-types";
import { PostDetail } from "./PostDetail";

const leadFormProps = vi.hoisted(() => vi.fn());
vi.mock("@/components/leads/LeadForm", () => ({
  LeadForm: (props: unknown) => {
    leadFormProps(props);
    return <form aria-label="lead" />;
  },
}));
vi.mock("@/components/home/StrengthsBlock", () => ({ StrengthsBlock: () => <section data-testid="strengths" /> }));
vi.mock("@/components/media/LazyMap", () => ({ LazyMap: ({ label }: { label: string }) => <div role="img" aria-label={label} /> }));

const iso = "2026-01-01T00:00:00.000Z";
const image = (id: string): Media => ({ ...fakeMedia(id), id, mimeType: "image/webp", updatedAt: iso, createdAt: iso }) as unknown as Media;
const category = { id: "c1", name: "Nhà phố", slug: "nha-pho", scope: "property_post", hasEnglish: true, updatedAt: iso, createdAt: iso } as unknown as Category;
const richText = (text: string): PropertyPost["content"] =>
  ({ root: { type: "root", version: 1, direction: "ltr", format: "", indent: 0, children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text }] }] } }) as PropertyPost["content"];

const post = (overrides: Partial<PropertyPost> = {}): PropertyPost =>
  ({
    id: "p1",
    title: "Bán nhà phố Quận 1",
    slug: "ban-nha-pho-quan-1",
    excerpt: "Nhà mặt tiền, sổ hồng riêng",
    status: "published",
    category,
    cover: image("cover"),
    content: richText("Nội dung tin đăng."),
    publishedAt: "2026-10-01T03:00:00.000Z",
    updatedAt: iso,
    createdAt: iso,
    ...overrides,
  }) as PropertyPost;

const fullPost = post({
  priceVnd: 3_500_000_000,
  areaM2: 85,
  bedrooms: 3,
  bathrooms: 2,
  houseDirection: "SE",
  frontageM: 5,
  floors: 4,
  propertyType: "townhouse",
  handoverCondition: "basic",
  address: "12 Nguyễn Huệ, Phường Sài Gòn",
  location: [106.7, 10.77],
  gallery: [image("g1"), image("g2")] as PropertyPost["gallery"],
});

const NOW = new Date("2026-10-18T03:00:00.000Z");
const strengths = { eyebrow: "Vì sao chọn TAMI", title: "Điểm mạnh", items: [] } as unknown as StrengthsView;

function renderPost(
  doc: PropertyPost,
  { related = [] as PropertyPost[], targets = { project: null, rental: null } as RelatedDocs, locale = "vi" as "vi" | "en", withStrengths = false } = {},
) {
  return renderWithIntl(
    <PostDetail
      doc={doc}
      view={toPostDetailView(doc, locale)}
      specs={toPostDetailSpecs(doc, locale)}
      offer={toPostOfferView(doc, locale, NOW, targets)}
      related={toPostCards(related, locale, NOW)}
      hotline={{ label: "0901 234 567", telHref: "tel:0901234567" }}
      ownPath="/tin-bds/ban-nha-pho-quan-1"
      shareUrl="https://tami.example/tin-bds/ban-nha-pho-quan-1"
      strengths={withStrengths ? strengths : null}
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
const tabLabels = () => within(screen.getByRole("navigation", { name: "Mục lục tin đăng" })).getAllByRole("link").map((link) => link.textContent);
const specTerms = (name = "Thông số tin đăng") => within(screen.getByRole("group", { name })).getAllByRole("term").map((term) => term.textContent);

beforeEach(() => {
  leadFormProps.mockClear();
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("PostDetail (BL-052, khung chi tiết chung)", () => {
  it("tin BĐS đủ trường: hero chứa h1 duy nhất + chip danh mục + địa chỉ + tóm tắt + chia sẻ; thanh thông số 6 ô; tab đủ, neo trỏ phần tử có thật", () => {
    const { container } = renderPost(fullPost, { related: [post({ id: "p2", title: "Tin khác", slug: "tin-khac" })] });
    const hero = container.querySelector("[data-detail-hero]") as HTMLElement;
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(hero).toContainElement(screen.getByRole("heading", { level: 1, name: "Bán nhà phố Quận 1" }));
    expect(hero).toHaveTextContent("Nhà phố");
    expect(hero).toHaveTextContent("12 Nguyễn Huệ, Phường Sài Gòn");
    expect(hero).toHaveTextContent("Nhà mặt tiền, sổ hồng riêng");
    expect(within(hero).getByRole("button", { name: "Chia sẻ" })).toBeInTheDocument();
    expect(hero.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(1);
    expect(within(hero).queryByRole("button", { name: "Xem video giới thiệu" })).toBeNull();

    expect(specTerms()).toEqual(["Giá", "Diện tích", "Phòng ngủ / tắm", "Hướng", "Mặt tiền", "Số tầng"]);
    const bar = screen.getByRole("group", { name: "Thông số tin đăng" });
    for (const value of ["3,5 tỷ", "85 m²", "3 phòng ngủ · 2 WC", "Đông Nam", "5 m", "4"]) expect(bar, value).toHaveTextContent(value);

    expect(tabLabels()).toEqual(["Tổng quan", "Vị trí", "Hình ảnh", "Tin liên quan"]);
    const links = within(screen.getByRole("navigation", { name: "Mục lục tin đăng" })).getAllByRole("link");
    for (const link of links) expect(container.querySelector(link.getAttribute("href")!), link.getAttribute("href")!).not.toBeNull();
  });

  it("Tổng quan: nội dung + lưới thông tin (Loại hình, Tình trạng bàn giao, danh mục, dự án liên quan là link, ngày đăng)", () => {
    const project = { id: "d1", title: "Sông Sài Gòn", slug: "song-sai-gon", gallery: [] } as unknown as Project;
    const { container } = renderPost(fullPost, { targets: { project, rental: null } });
    const overview = container.querySelector("#overview") as HTMLElement;
    expect(overview).toHaveTextContent("Nội dung tin đăng.");
    const info = within(overview.querySelector("dl") as HTMLElement);
    expect(info.getAllByRole("term").map((term) => term.textContent)).toEqual(["Loại hình", "Tình trạng bàn giao", "Danh mục", "Dự án liên quan", "Ngày đăng"]);
    expect(overview).toHaveTextContent("Nhà phố/Liền kề");
    expect(overview).toHaveTextContent("Hoàn thiện cơ bản");
    expect(info.getByRole("link", { name: "Sông Sài Gòn" })).toHaveAttribute("href", "/du-an/song-sai-gon");
    expect(overview.querySelector("time")).toHaveAttribute("datetime", "2026-10-01T03:00:00.000Z");
    // Dự án liên quan chỉ ở lưới thông tin, không lặp thành thẻ trong mục Ưu đãi (tin không có ưu đãi → không có mục).
    expect(container.querySelector("#offer")).toBeNull();
  });

  it("tin cũ trống trường: không thanh thông số, không dải Vị trí / Hình ảnh; tab chỉ Tổng quan", () => {
    const { container } = renderPost(post({ category: null, content: null as never }));
    expect(screen.queryByRole("group", { name: "Thông số tin đăng" })).toBeNull();
    expect(tabLabels()).toEqual(["Tổng quan"]);
    expect(container.querySelector("[data-detail-band]")).toBeNull();
    // BL-056: không có nội dung → tóm tắt vừa ở hero vừa làm đoạn dẫn của Tổng quan (user chốt "ưu tiên tóm tắt"), không có nút "Xem thêm".
    expect(container.querySelector("[data-detail-hero]")).toHaveTextContent("Nhà mặt tiền, sổ hồng riêng");
    expect(container.querySelector("#overview")).toHaveTextContent("Nhà mặt tiền, sổ hồng riêng");
    expect(container.querySelector("#overview details")).toBeNull();
  });

  it("Vị trí: có toạ độ → bản đồ; chỉ địa chỉ / khu vực → dòng địa chỉ, không bản đồ", () => {
    renderPost(fullPost);
    expect(screen.getByRole("img", { name: "Bản đồ vị trí Bán nhà phố Quận 1" })).toBeInTheDocument();
    const { container } = renderPost(post({ address: "45 Lê Lợi" }));
    const location = container.querySelector("#location") as HTMLElement;
    expect(location).toHaveTextContent("45 Lê Lợi");
    expect(within(location).queryByRole("img")).toBeNull();
  });

  it("voucher còn hạn: thanh thông số Hạn ưu đãi · Trạng thái (+ Giá), mục Ưu đãi có mã + nút sao chép, cạnh cột liên hệ", () => {
    const { container } = renderPost(post({ offer: { endAt: "2026-10-30T12:00:00.000Z", voucherCode: "TAMI500", terms: "Áp dụng 1 lần" }, priceNote: "Giảm 5%" }));
    expect(specTerms()).toEqual(["Hạn ưu đãi", "Trạng thái", "Giá"]);
    const bar = screen.getByRole("group", { name: "Thông số tin đăng" });
    expect(bar).toHaveTextContent("30/10/2026");
    expect(bar).toHaveTextContent("Còn hạn");
    expect(bar).toHaveTextContent("Giảm 5%");
    expect(tabLabels()).toEqual(["Tổng quan", "Ưu đãi"]);
    const offer = screen.getByRole("region", { name: "Thông tin ưu đãi" });
    expect(offer).toHaveTextContent("TAMI500");
    expect(offer).toHaveTextContent("Điều khoản áp dụng");
    expect(within(offer).getByRole("button", { name: "Sao chép" })).toBeInTheDocument();
    expect(container.querySelector("[data-section-style='cards']")).toContainElement(offer);
    expect(follows(container.querySelector("#overview") as HTMLElement, offer)).toBe(true);
  });

  it("voucher sắp hết hạn: badge cảnh báo trên hero, trạng thái 'Còn n ngày'", () => {
    const { container } = renderPost(post({ offer: { endAt: "2026-10-20T12:00:00.000Z", voucherCode: "TAMI500" } }));
    expect(container.querySelector("[data-detail-hero]")).toHaveTextContent(/Còn \d+ ngày/);
    expect(screen.getByRole("group", { name: "Thông số tin đăng" })).toHaveTextContent(/Còn \d+ ngày/);
  });

  it("voucher hết hạn (BR-06): 'Đã kết thúc' ở hero + thanh thông số + mục Ưu đãi; KHÔNG có mã trong HTML, không nút sao chép; form vẫn nhận khách", () => {
    const { container } = renderPost(post({ offer: { endAt: "2026-10-17T12:00:00.000Z", voucherCode: "TAMI500" } }));
    expect(container.querySelector("[data-detail-hero]")).toHaveTextContent("Đã kết thúc");
    expect(screen.getByRole("group", { name: "Thông số tin đăng" })).toHaveTextContent("Đã kết thúc");
    expect(screen.getByText("Ưu đãi đã kết thúc")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sao chép" })).toBeNull();
    expect(container.innerHTML).not.toContain("TAMI500");
    expect(screen.getByRole("heading", { level: 2, name: "Nhận tư vấn" })).toBeInTheDocument();
  });

  it("tin bán kèm ưu đãi: thanh thông số kiểu BĐS, vẫn có mục Ưu đãi; hộp ưu đãi không lặp giá", () => {
    renderPost(post({ priceVnd: 2_000_000_000, offer: { voucherCode: "TAMI500" } }));
    expect(specTerms()).toEqual(["Giá"]);
    const offer = screen.getByRole("region", { name: "Thông tin ưu đãi" });
    expect(offer).toHaveTextContent("TAMI500");
    expect(offer).not.toHaveTextContent("2 tỷ");
  });

  it("cột liên hệ: đúng một form source=property_post trong aside + khối Hotline 'Gọi ngay'", () => {
    const { container } = renderPost(fullPost);
    expect(leadFormProps).toHaveBeenCalledWith(expect.objectContaining({ source: "property_post", sourceId: "p1" }));
    expect(container.querySelectorAll("form")).toHaveLength(1);
    const aside = screen.getByRole("complementary", { name: "Nhận tư vấn" });
    expect(aside).toContainElement(container.querySelector("#lead-form") as HTMLElement);
    expect(within(aside).getByRole("link", { name: "Gọi ngay 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
  });

  it("cuối trang: Tin liên quan (#related, nền trắng, 'Xem tất cả tin đăng') → dải Điểm mạnh → banner tư vấn", () => {
    const { container } = renderPost(fullPost, { related: [post({ id: "p2", title: "Tin khác", slug: "tin-khac" })], withStrengths: true });
    const related = container.querySelector("#related") as HTMLElement;
    const heading = within(related).getByRole("heading", { level: 2, name: "Tin liên quan" });
    expect(heading.closest("section")?.className).toContain("bg-surface");
    expect(within(related).getByRole("heading", { level: 3, name: "Tin khác" })).toBeInTheDocument();
    expect(within(related).getByRole("link", { name: "Xem tất cả tin đăng" })).toHaveAttribute("href", "/tin-bds");
    const strengthsBlock = screen.getByTestId("strengths");
    expect(follows(related, strengthsBlock)).toBe(true);
    expect(follows(strengthsBlock, screen.getByTestId("consult-banner"))).toBe(true);
  });

  it("không có tin liên quan / cờ Điểm mạnh tắt → không dựng khối", () => {
    const { container } = renderPost(fullPost);
    expect(container.querySelector("#related")).toBeNull();
    expect(screen.queryByTestId("strengths")).toBeNull();
  });

  it("bản EN: nhãn thanh thông số, tab, lưới thông tin theo i18n", () => {
    renderPost(fullPost, { locale: "en" });
    expect(specTerms("Listing facts")).toEqual(["Price", "Area", "Bed / bath", "Facing", "Frontage", "Floors"]);
    expect(screen.getByRole("group", { name: "Listing facts" })).toHaveTextContent("Southeast");
    expect(screen.getByText("Townhouse")).toBeInTheDocument();
    expect(screen.getByText("Basic finish")).toBeInTheDocument();
  });
});
