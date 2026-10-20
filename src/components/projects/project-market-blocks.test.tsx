import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { toProjectDetailView } from "@/lib/projects/project-detail-view";
import type { Locale } from "@/i18n/routing";
import type { Media, Project, Province } from "@/payload-types";
import { NearbyTabs } from "./NearbyTabs";
import { PriceTable } from "./PriceTable";
import { ProjectDetail } from "./ProjectDetail";
import { ProjectListings } from "./ProjectListings";
import { ProjectLocation } from "./ProjectLocation";

const lazyMapProps = vi.hoisted(() => ({ calls: [] as Record<string, unknown>[] }));
vi.mock("@/components/media/LazyMap", () => ({
  LazyMap: (props: Record<string, unknown>) => {
    lazyMapProps.calls.push(props);
    return <div data-testid="lazy-map" />;
  },
}));

const now = "2026-01-01T00:00:00.000Z";
const image = (id: string): Media => ({ ...fakeMedia(id), id, mimeType: "image/webp", updatedAt: now, createdAt: now });
const province: Province = { id: "p1", code: "01", name: "Thành phố Hà Nội", shortName: "Hà Nội", slug: "ha-noi", updatedAt: now, createdAt: now };

const project = (overrides: Partial<Project> = {}): Project =>
  ({
    id: "d1",
    title: "Dự án Sông Sài Gòn",
    slug: "song-sai-gon",
    summary: "Mô tả ngắn",
    status: "published",
    salesStatus: "selling",
    province,
    gallery: [image("g1")],
    author: "a1",
    updatedAt: now,
    createdAt: now,
    ...overrides,
  }) as Project;

const marketProject = project({
  address: "Số 1 Đường A",
  location: [105.8, 21.03],
  highlights: [
    { title: "Gần metro", description: "Cách ga 300 m" },
    { title: "Hồ trung tâm" },
  ],
  nearbyAmenities: [
    { category: "education", name: "Trường A", distance: "500 m", location: [105.81, 21.04] },
    { category: "healthcare", name: "Bệnh viện B", distance: "1,2 km" },
    { category: "transport", name: "Ga C", distance: "5 phút" },
  ],
  priceTable: [
    { unitType: "Căn 2PN", areaFrom: 60, areaTo: 75, priceFrom: 3_000_000_000, priceTo: 4_000_000_000, availability: "available", note: "Giá chưa VAT" },
    { unitType: "Căn 3PN", areaFrom: 90, availability: "few_left" },
    { unitType: "Penthouse", availability: "sold_out" },
    { unitType: "Shophouse" },
  ],
  priceUpdatedAt: "2026-10-05T03:00:00.000Z",
  faqs: [
    { question: "Khi nào bàn giao?", answer: "Quý 4/2027." },
    { question: "Có vay ngân hàng không?", answer: "Có.\nHỗ trợ lãi suất ưu đãi." },
  ],
  legalInfo: { root: { type: "root", version: 1, direction: null, format: "", indent: 0, children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text: "Sổ hồng" }] }] } } as never,
});

function renderDetail(doc: Project, locale: Locale = "vi") {
  return renderWithIntl(<ProjectDetail doc={doc} view={toProjectDetailView(doc, locale)} related={[]} ownPath="/du-an/song-sai-gon" />, locale);
}

class FakeIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  lazyMapProps.calls.length = 0;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const jsonLdScripts = (container: HTMLElement) => Array.from(container.querySelectorAll('script[type="application/ld+json"]')).filter((script) => script.textContent?.includes("FAQPage"));

describe("Khối market của chi tiết dự án (BL-020 P5)", () => {
  it("dự án chưa có dữ liệu mới → không khối, không mục con, không JSON-LD", () => {
    const { container } = renderDetail(project());
    for (const name of ["Điểm nổi bật", "Bảng giá", "Câu hỏi thường gặp", "Tiện ích xung quanh"]) expect(screen.queryByRole("heading", { name }), name).toBeNull();
    const nav = screen.getByRole("navigation", { name: "Mục lục dự án" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Tổng quan"]);
    expect(container.querySelector("#highlights, #pricing, #faq")).toBeNull();
    expect(jsonLdScripts(container)).toHaveLength(0);
  });

  it("đủ khối → thanh mục con theo thứ tự mới, mỗi neo trỏ tới phần tử có thật, h2 đúng tên, tiện ích quanh nằm trong Vị trí", () => {
    const { container } = renderDetail(marketProject);
    const nav = screen.getByRole("navigation", { name: "Mục lục dự án" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Tổng quan", "Nổi bật", "Vị trí", "Pháp lý", "Giá", "Hỏi đáp"]);
    for (const link of within(nav).getAllByRole("link")) expect(container.querySelector(link.getAttribute("href")!), link.getAttribute("href")!).not.toBeNull();
    for (const name of ["Điểm nổi bật", "Bảng giá", "Câu hỏi thường gặp"]) expect(screen.getByRole("heading", { level: 2, name }), name).toBeInTheDocument();
    const location = container.querySelector("#location") as HTMLElement;
    expect(within(location).getByRole("heading", { level: 3, name: "Tiện ích xung quanh" })).toBeInTheDocument();
    // Thứ tự trong cột chính: Nổi bật → Vị trí → Pháp lý → Giá → FAQ.
    const order = ["#highlights", "#location", "#legal", "#pricing", "#faq"].map((selector) => container.querySelector(selector) as HTMLElement);
    for (let index = 1; index < order.length; index += 1) {
      expect(order[index - 1]!.compareDocumentPosition(order[index]!) & Node.DOCUMENT_POSITION_FOLLOWING, `thứ ${index}`).toBeTruthy();
    }
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("Điểm nổi bật: lưới thẻ 1/2/3 cột, tiêu đề h3 + mô tả (không mô tả thì chỉ tiêu đề)", () => {
    const { container } = renderDetail(marketProject);
    const section = container.querySelector("#highlights") as HTMLElement;
    const list = within(section).getByRole("list");
    expect(list.className).toContain("sm:grid-cols-2");
    expect(list.className).toContain("xl:grid-cols-3");
    const cards = within(list).getAllByRole("listitem");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]!).getByRole("heading", { level: 3, name: "Gần metro" })).toBeInTheDocument();
    expect(within(cards[0]!).getByText("Cách ga 300 m")).toBeInTheDocument();
    expect(cards[1]!.querySelectorAll("p")).toHaveLength(0);
  });

  it("Pháp lý gộp richText + tài liệu: chỉ có tài liệu vẫn hiện khối Pháp lý; chỉ có richText thì không có h3 Tài liệu", () => {
    const pdf = { id: "pdf1", alt: "Bảng giá", url: "/api/media/file/pdf1.pdf", mimeType: "application/pdf", filesize: 1024 * 1024, updatedAt: now, createdAt: now } as Media;
    const docsOnly = renderDetail(project({ documents: [pdf] }));
    const legal = docsOnly.container.querySelector("#legal") as HTMLElement;
    expect(within(legal).getByRole("heading", { level: 2, name: /Pháp lý/ })).toBeInTheDocument();
    expect(within(legal).getByRole("heading", { level: 3, name: "Tài liệu" })).toBeInTheDocument();
    expect(within(nav(docsOnly.container)).getAllByRole("link").map((link) => link.textContent)).toContain("Pháp lý");
    docsOnly.unmount();
    const richOnly = renderDetail(marketProject);
    expect(within(richOnly.container.querySelector("#legal") as HTMLElement).queryByRole("heading", { name: "Tài liệu" })).toBeNull();
    expect(screen.getByText("Sổ hồng")).toBeInTheDocument();
  });
});

function nav(container: HTMLElement): HTMLElement {
  return within(container).getByRole("navigation", { name: "Mục lục dự án" });
}

describe("NearbyTabs", () => {
  const groups = toProjectDetailView(marketProject, "vi").nearby;

  it("tablist ARIA: chỉ nhóm có dòng, tab đầu chọn sẵn, ←/→ vòng, Home/End, roving tabindex, panel gắn đúng tab", async () => {
    const user = userEvent.setup();
    renderWithIntl(<NearbyTabs groups={groups} />);
    const tablist = screen.getByRole("tablist", { name: "Nhóm tiện ích xung quanh" });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Giáo dục", "Y tế", "Giao thông"]);
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
    expect(screen.getByRole("tabpanel", { name: "Giáo dục" })).toHaveTextContent("Trường A");
    expect(screen.getByRole("tabpanel", { name: "Giáo dục" })).toHaveTextContent("500 m");
    expect(screen.getByRole("tabpanel", { name: "Giáo dục" })).toHaveAttribute("tabindex", "0");
    tabs[0]!.focus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Y tế" })).toHaveTextContent("Bệnh viện B");
    expect(screen.queryByRole("tabpanel", { name: "Giáo dục" })).toBeNull();
    await user.keyboard("{End}");
    expect(tabs[2]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[0]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(tabs[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveFocus();
    await user.click(tabs[2]!);
    expect(screen.getByRole("tabpanel", { name: "Giao thông" })).toHaveTextContent("5 phút");
  });

  it("HTML đầu có đủ panel (panel không chọn chỉ `hidden`); một nhóm duy nhất không dựng tablist", () => {
    const { container, unmount } = renderWithIntl(<NearbyTabs groups={groups} />);
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(3);
    expect(container.querySelectorAll('[role="tabpanel"][hidden]')).toHaveLength(2);
    unmount();
    renderWithIntl(<NearbyTabs groups={groups.slice(0, 1)} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("list", { name: "Giáo dục" })).toHaveTextContent("Trường A");
  });

  it("/en: nhãn nhóm tiếng Anh", () => {
    renderWithIntl(<NearbyTabs groups={groups} />, "en");
    expect(within(screen.getByRole("tablist", { name: "Nearby amenity groups" })).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Education", "Healthcare", "Transport"]);
  });
});

describe("ProjectLocation + tiện ích quanh", () => {
  it("tiện ích có toạ độ → điểm phụ truyền cho bản đồ (tiện ích không toạ độ thì không); chỉ có tiện ích quanh vẫn render khối, không dựng bản đồ", () => {
    const view = toProjectDetailView(marketProject, "vi");
    renderWithIntl(<ProjectLocation projectName={view.title} location={view.location} address={view.address} areaLabel={view.areaLabel} nearby={view.nearby} />);
    expect(lazyMapProps.calls[0]?.markers).toEqual([{ lat: 21.04, lng: 105.81, label: "Trường A" }]);
    const nearbyOnly = toProjectDetailView(project({ nearbyAmenities: [{ category: "park", name: "Công viên A", distance: "1 km" }] }), "vi");
    lazyMapProps.calls.length = 0;
    renderWithIntl(<ProjectLocation projectName="X" location={nearbyOnly.location} address={nearbyOnly.address} areaLabel={nearbyOnly.areaLabel} nearby={nearbyOnly.nearby} />);
    expect(lazyMapProps.calls).toHaveLength(0);
    expect(screen.getByText("Công viên A")).toBeInTheDocument();
  });
});

describe("PriceTable", () => {
  const view = toProjectDetailView(marketProject, "vi");

  it("cột + th scope đúng, khoảng diện tích/giá, một đầu → Từ…, trống giá → Liên hệ, ngày cập nhật dd/MM/yyyy, vùng cuộn có tên + tabIndex", () => {
    renderWithIntl(<PriceTable rows={view.priceRows} updatedAt={view.priceUpdatedAt} />);
    const table = screen.getByRole("table", { name: "Bảng giá tham khảo theo loại căn" });
    expect(within(table).getAllByRole("columnheader").map((th) => [th.textContent, th.getAttribute("scope")])).toEqual([
      ["Loại căn", "col"],
      ["Diện tích (m²)", "col"],
      ["Giá", "col"],
      ["Tình trạng", "col"],
      ["Ghi chú", "col"],
    ]);
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(4);
    for (const row of rows) expect(within(row).getAllByRole("rowheader")[0]).toHaveAttribute("scope", "row");
    const cells = (row: HTMLElement) => within(row).getAllByRole("cell").map((cell) => cell.textContent);
    expect(cells(rows[0]!)).toEqual(["60 – 75 m²", "3 tỷ – 4 tỷ", "Còn hàng", "Giá chưa VAT"]);
    expect(cells(rows[1]!)).toEqual(["Từ 90 m²", "Liên hệ", "Sắp hết", "—"]);
    expect(cells(rows[2]!)[1]).toBe("Liên hệ");
    expect(cells(rows[3]!)).toEqual(["—", "Liên hệ", "—Chưa cập nhật", "—"]);
    expect(screen.getByText("Cập nhật ngày 05/10/2026")).toBeInTheDocument();
    const region = screen.getByRole("region", { name: "Bảng giá tham khảo theo loại căn" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region.className).toContain("overflow-x-auto");
  });

  it("huy hiệu tình trạng dùng token AA riêng cho còn / sắp hết / hết", () => {
    renderWithIntl(<PriceTable rows={view.priceRows} updatedAt={null} />);
    expect(screen.getByText("Còn hàng").className).toContain("text-success-text");
    expect(screen.getByText("Sắp hết").className).toContain("text-warning");
    expect(screen.getByText("Hết hàng").className).toContain("text-error");
    expect(screen.queryByText(/Cập nhật ngày/)).toBeNull();
  });

  it("giá từ == đến hiện một giá trị; chỉ \"đến\" → \"Đến X\"; giá trị 0 coi như chưa nhập (Liên hệ / —)", () => {
    const edge = toProjectDetailView(
      project({
        priceTable: [
          { unitType: "Bằng nhau", areaFrom: 70, areaTo: 70, priceFrom: 3_000_000_000, priceTo: 3_000_000_000 },
          { unitType: "Chỉ đến", areaTo: 80, priceTo: 5_000_000_000 },
          { unitType: "Số 0", areaFrom: 0, areaTo: 0, priceFrom: 0, priceTo: 0 },
        ],
      }),
      "vi",
    );
    renderWithIntl(<PriceTable rows={edge.priceRows} updatedAt={null} />);
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    const cells = (row: HTMLElement) => within(row).getAllByRole("cell").map((cell) => cell.textContent);
    expect(cells(rows[0]!).slice(0, 2)).toEqual(["70 m²", "3 tỷ"]);
    expect(cells(rows[1]!).slice(0, 2)).toEqual(["Đến 80 m²", "Đến 5 tỷ"]);
    expect(cells(rows[2]!).slice(0, 2)).toEqual(["—", "Liên hệ"]);
  });

  it("/en: 'Contact us', 'From', VND rút gọn tiếng Anh", () => {
    const en = toProjectDetailView(marketProject, "en");
    renderWithIntl(<PriceTable rows={en.priceRows} updatedAt={en.priceUpdatedAt} />, "en");
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(within(rows[0]!).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["60 – 75 m²", "3 billion VND – 4 billion VND", "Available", "Giá chưa VAT"]);
    expect(within(rows[1]!).getAllByRole("cell")[1]).toHaveTextContent("Contact us");
    expect(within(rows[1]!).getAllByRole("cell")[0]).toHaveTextContent("From 90 m²");
  });
});

describe("FAQ", () => {
  it("accordion details/summary gốc (đóng sẵn, mỗi câu độc lập, câu trả lời giữ xuống dòng) + một JSON-LD FAQPage đúng nội dung", () => {
    const { container } = renderDetail(marketProject);
    const section = container.querySelector("#faq") as HTMLElement;
    const items = section.querySelectorAll("details");
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.hasAttribute("open")).toBe(false);
      expect(item.querySelector("summary")).not.toBeNull();
    }
    expect(items[1]!.querySelector("p")!.className).toContain("whitespace-pre-line");
    const scripts = jsonLdScripts(container).filter((script) => script.textContent?.includes("FAQPage"));
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0]!.textContent!)).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "vi",
      mainEntity: [
        { "@type": "Question", name: "Khi nào bàn giao?", acceptedAnswer: { "@type": "Answer", text: "Quý 4/2027." } },
        { "@type": "Question", name: "Có vay ngân hàng không?", acceptedAnswer: { "@type": "Answer", text: "Có.\nHỗ trợ lãi suất ưu đãi." } },
      ],
    });
  });

  it("nội dung có </script> không đóng thẻ sớm (escape `<`) và vẫn parse lại đúng chuỗi gốc", () => {
    const evil = project({ faqs: [{ question: "Q </script><script>alert(1)</script>", answer: "A <b>x</b>" }] });
    const { container } = renderDetail(evil);
    const raw = jsonLdScripts(container).find((script) => script.textContent?.includes("FAQPage"))!.textContent!;
    expect(raw).not.toContain("</script>");
    expect(raw).not.toContain("<");
    expect(JSON.parse(raw).mainEntity[0].name).toBe("Q </script><script>alert(1)</script>");
    expect(container.querySelectorAll("script[type]:not([type='application/ld+json'])")).toHaveLength(0);
  });

  it("/en chỉ dùng chữ EN: câu thiếu bản EN bị bỏ cả khỏi accordion lẫn JSON-LD; hết câu → không khối, không mục con, không JSON-LD", () => {
    const partial = project({ faqs: [{ question: "When is handover?", answer: "Q4/2027." }, { question: "Chỉ có tiếng Việt", answer: "" }] as never });
    const { container, unmount } = renderDetail(partial, "en");
    expect(container.querySelectorAll("#faq details")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: "Frequently asked questions" })).toBeInTheDocument();
    const data = JSON.parse(jsonLdScripts(container).find((script) => script.textContent?.includes("FAQPage"))!.textContent!);
    expect(data.inLanguage).toBe("en");
    expect(data.mainEntity).toHaveLength(1);
    expect(data.mainEntity[0].name).toBe("When is handover?");
    expect(container.textContent).not.toContain("Chỉ có tiếng Việt");
    unmount();
    const none = renderDetail(project({ faqs: [{ question: "Chỉ VI", answer: "" }] as never }), "en");
    expect(none.container.querySelector("#faq")).toBeNull();
    expect(jsonLdScripts(none.container)).toHaveLength(0);
    expect(within(none.container.querySelector("nav") as HTMLElement).queryByText("FAQ")).toBeNull();
  });
});

describe("Carry-over P4-T02: ảnh thẻ cho thuê trong chi tiết dự án", () => {
  it("RentalCard nhận imageSizes của lưới 2 cột (không dùng sizes lưới 4 cột)", () => {
    const rental = { id: "r1", title: "Căn cho thuê", href: "/cho-thue/r1", areaM2: 60, bedrooms: 2, cover: image("rc") } as never;
    const { container } = renderWithIntl(<ProjectListings rentals={[rental]} posts={[]} />);
    expect(container.querySelector("img")!.getAttribute("sizes")).toBe("(min-width: 1280px) 390px, (min-width: 640px) 45vw, 100vw");
  });
});
