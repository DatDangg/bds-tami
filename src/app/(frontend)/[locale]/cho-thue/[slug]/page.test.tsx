import { screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { getClickRef } from "@/components/layout/ClickRefMarker";
import type { SaleContact } from "@/lib/rentals/rental-queries";
import type { Category, Media, Project, Province, Rental, Ward } from "@/payload-types";

const findPublicRentalBySlug = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<Partial<Rental> | null>>());
const findSimilarRentals = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<Partial<Rental>[]>>());
const findRentalPrivateFields = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<{ authorId: string | null; location: [number, number] | null }>>());
const findActiveSaleContact = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<SaleContact | null>>());
const getSiteSettings = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
const lazyMapProps = vi.hoisted(() => [] as Record<string, unknown>[]);
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/rentals/rental-queries", () => ({ findPublicRentalBySlug, findSimilarRentals, findRentalPrivateFields, findActiveSaleContact }));
vi.mock("@/lib/news/news-queries", () => ({ findLocalizedSlugs: async () => ({ vi: "can-ho-2pn", en: "two-bedroom" }) }));
vi.mock("@/lib/content/get-globals", () => ({ getSiteSettings }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
// LazyMap là Client Component dựng MapLibre: thay bằng bản ghi props để kiểm toạ độ nào được đưa vào HTML công khai.
vi.mock("@/components/media/LazyMap", () => ({
  LazyMap: (props: Record<string, unknown>) => {
    lazyMapProps.push(props);
    return <div data-testid="lazy-map" />;
  },
}));
// ConsultBanner là Server Component async (đọc homepage CMS): jsdom không dựng được; chỉ kiểm tra trang truyền đúng props.
const consultBannerProps = vi.hoisted(() => vi.fn());
vi.mock("@/components/layout/ConsultBanner", () => ({
  ConsultBanner: (props: unknown) => {
    consultBannerProps(props);
    return <section data-testid="consult-banner" />;
  },
}));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: vi } = await import("@/i18n/messages/vi.json");
  const { default: en } = await import("@/i18n/messages/en.json");
  const messages = { vi, en };
  return {
    setRequestLocale: () => undefined,
    getTranslations: async ({ locale, namespace }: { locale: "vi" | "en"; namespace: string }) =>
      createTranslator({ locale, messages: messages[locale], namespace: namespace as never }),
  };
});

import RentalDetailPage, { generateMetadata } from "./page";

const now = "2026-01-01T00:00:00.000Z";
const image = (id: string, alt = `Ảnh ${id}`): Media => ({ ...fakeMedia(id, alt), id, mimeType: "image/webp", updatedAt: now, createdAt: now });
const province: Province = { id: "p1", code: "79", name: "Thành phố Hồ Chí Minh", shortName: "TP.HCM", slug: "ho-chi-minh", updatedAt: now, createdAt: now };
const ward = { id: "w1", name: "Phường Sài Gòn", province: "p1", code: "1", type: "phuong", slug: "sai-gon", updatedAt: now, createdAt: now } as unknown as Ward;
const category = { id: "c1", name: "Căn hộ", slug: "can-ho", scope: "rental", hasEnglish: true, updatedAt: now, createdAt: now } as unknown as Category;
const rental = (overrides: Partial<Rental> = {}): Partial<Rental> => ({
  id: "r1",
  code: "CT-000001",
  title: "Căn hộ 2PN Quận 1",
  slug: "can-ho-2pn",
  status: "published",
  hasEnglish: false,
  province,
  ward,
  category,
  areaM2: 55,
  bedrooms: 2,
  bathrooms: 1,
  floor: "Tầng 12",
  houseDirection: "SE",
  furnishing: "full",
  priceMonthlyVnd: 12_000_000,
  publishedAt: "2026-02-03T00:00:00.000Z",
  showExactAddress: false,
  author: "s1",
  gallery: [image("g1"), image("g2")],
  rentalTerms: { minLeaseMonths: 6, depositMonths: 2, paymentCycle: "quarterly", includedServices: ["water", "internet"] },
  description: { root: { type: "root", version: 1, direction: "ltr", format: "", indent: 0, children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text: "Căn hộ thoáng, đầy đủ nội thất." }] }] } } as Rental["description"],
  ...overrides,
});
const sale: SaleContact = { fullName: "Nguyễn Văn Sale", phone: "0901 111 222", avatar: null };

async function renderRental(locale: "vi" | "en" = "vi", slug = "can-ho-2pn"): Promise<ReturnType<typeof renderWithIntl>> {
  const ui = (await RentalDetailPage({ params: Promise.resolve({ locale, slug }) })) as ReactElement;
  return renderWithIntl(ui, locale);
}

const jsonLdItems = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map((node) => JSON.parse(node.textContent ?? "null") as Record<string, unknown>);
const meta = (slug = "can-ho-2pn", locale: "vi" | "en" = "vi") => generateMetadata({ params: Promise.resolve({ locale, slug }) });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  getSiteSettings.mockResolvedValue({ hotline: "0901 234 567" });
  findSimilarRentals.mockResolvedValue([]);
  findRentalPrivateFields.mockResolvedValue({ authorId: "s1", location: null });
  findActiveSaleContact.mockResolvedValue(sale);
  lazyMapProps.length = 0;
});
afterEach(() => {
  vi.unstubAllEnvs();
  for (const mock of [findPublicRentalBySlug, findSimilarRentals, findRentalPrivateFields, findActiveSaleContact, getSiteSettings]) mock.mockReset();
});

describe("trang chi tiết tin cho thuê (S07)", () => {
  it("render đủ: một h1, mã tin, giá/thông số, chi tiết, điều khoản, mô tả, vị trí phường/tỉnh, sale phụ trách + form lead", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental({ videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", legalNote: "Sổ hồng riêng" }));
    const { container } = await renderRental();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Căn hộ 2PN Quận 1" })).toBeInTheDocument();
    expect(container.textContent).toContain("CT-000001");
    expect(container.textContent).toContain("Phường Sài Gòn, TP.HCM");
    const titleCard = screen.getByRole("heading", { level: 1 }).closest("div[class*='rounded-[28px]']") as HTMLElement;
    expect(titleCard).toHaveTextContent("12 triệu/tháng");
    const facts = within(screen.getByRole("list", { name: "Thông số chính" }));
    expect(facts.getByText("55 m²")).toBeInTheDocument();
    const details = within(screen.getByRole("heading", { level: 2, name: "Thông tin chi tiết" }).closest("section") as HTMLElement);
    expect(details.getByText("Tầng 12")).toBeInTheDocument();
    expect(details.getByText("Đông Nam")).toBeInTheDocument();
    expect(details.getByText("Đầy đủ")).toBeInTheDocument();
    expect(details.getByRole("link", { name: "Căn hộ" })).toHaveAttribute("href", "/cho-thue/danh-muc/can-ho");
    const terms = within(screen.getByRole("heading", { level: 2, name: "Điều khoản thuê" }).closest("section") as HTMLElement);
    expect(terms.getByText("Hàng quý")).toBeInTheDocument();
    expect(terms.getByText("Internet")).toBeInTheDocument();
    expect(screen.getByText("Căn hộ thoáng, đầy đủ nội thất.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Phát video/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Video" })).toBeInTheDocument();
    expect(screen.getByText("Sổ hồng riêng")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn Sale")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gọi 0901 111 222" })).toHaveAttribute("href", "tel:0901111222");
    expect(container.querySelector("#lead-form")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Nhận tư vấn" })).toBeInTheDocument();
    expect(screen.queryByText("Đã thuê")).toBeNull();
  });

  it("sale bị khoá / đã xoá / thiếu SĐT → hotline chung, KHÔNG hiện tên sale", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental());
    findActiveSaleContact.mockResolvedValue(null);
    const { container, unmount } = await renderRental();
    expect(container.textContent).not.toContain("Nguyễn Văn Sale");
    expect(screen.queryByText("Người phụ trách")).toBeNull();
    expect(screen.getByRole("link", { name: "Gọi hotline 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    unmount();

    findActiveSaleContact.mockResolvedValue({ fullName: "Sale Không SĐT", phone: "  ", avatar: null });
    const second = await renderRental();
    expect(second.container.textContent).not.toContain("Sale Không SĐT");
    expect(screen.getByRole("link", { name: "Gọi hotline 0901 234 567" })).toBeInTheDocument();
  });

  it("tin tương tự: gọi truy vấn với tin hiện tại, hiện thẻ link h3 trong khối 'Căn tương tự' sau nội dung", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental());
    findSimilarRentals.mockResolvedValue([rental({ id: "r2", title: "Căn hộ 1PN", slug: "can-ho-1pn", code: "CT-000002", priceMonthlyVnd: 8_500_000 })]);
    const { container } = await renderRental();
    expect(findSimilarRentals).toHaveBeenCalledWith({}, "vi", expect.objectContaining({ id: "r1" }));
    const section = screen.getByRole("heading", { level: 2, name: "Căn tương tự" }).closest("section") as HTMLElement;
    expect(within(section).getByRole("heading", { level: 3, name: "Căn hộ 1PN" })).toBeInTheDocument();
    expect(within(section).getByRole("link")).toHaveAttribute("href", "/cho-thue/can-ho-1pn");
    expect(section.textContent).toContain("8,5 triệu/tháng");
    const h1 = container.querySelector("h1") as HTMLElement;
    expect(h1.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("không có tin tương tự → không render khối rỗng", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental());
    await renderRental();
    expect(screen.queryByRole("heading", { name: /tương tự/i })).toBeNull();
  });

  it("ghi bản ghi đang xem cho nút liên hệ nổi (thống kê theo tin)", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental());
    await renderRental();
    expect(getClickRef()).toEqual({ collection: "rentals", id: "r1" });
  });

  it("404: slug lạ / EN chưa dịch / locale sai", async () => {
    findPublicRentalBySlug.mockResolvedValue(null);
    await expect(RentalDetailPage({ params: Promise.resolve({ locale: "en", slug: "chua-dich" }) })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(findPublicRentalBySlug).toHaveBeenCalledWith({}, "en", "chua-dich");
    expect(await meta("chua-dich", "en")).toEqual({});
    await expect(RentalDetailPage({ params: Promise.resolve({ locale: "fr", slug: "x" }) })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("/en: nhãn tiếng Anh, breadcrumb về /en/for-rent, JSON-LD inLanguage en", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental({ title: "Two bedroom", slug: "two-bedroom", hasEnglish: true }));
    const { container } = await renderRental("en", "two-bedroom");
    expect(screen.getByRole("list", { name: "Key facts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "For rent" })).toHaveAttribute("href", "/en/for-rent");
    expect(jsonLdItems(container).find((item) => item["@type"] === "RealEstateListing")).toMatchObject({ inLanguage: "en", url: "https://tami.example/en/for-rent/two-bedroom" });
    expect(container.textContent).not.toMatch(/Thông số|Điều khoản|Gọi/);
  });
});

describe("khung chi tiết mới: chia sẻ + banner tư vấn", () => {
  it("nút chia sẻ trong khối tiêu đề; banner tư vấn nhận nút chính cuộn tới #lead-form và nút phụ gọi hotline", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental());
    await renderRental();
    expect(screen.getByRole("button", { name: "Chia sẻ" })).toBeInTheDocument();
    expect(screen.getByTestId("consult-banner")).toBeInTheDocument();
    expect(consultBannerProps).toHaveBeenCalledWith(expect.objectContaining({ locale: "vi", actionHref: "#lead-form", secondary: { label: "Gọi hotline 0901 234 567", href: "tel:0901234567" } }));
  });
});

describe("tin đã thuê (BR-01)", () => {
  const rented = () => rental({ status: "rented", rentedAt: now });

  it("metadata: noindex nhưng follow (production); tin còn trống thì index", async () => {
    vi.stubEnv("APP_ENV", "production");
    findPublicRentalBySlug.mockResolvedValueOnce(rented());
    expect((await meta()).robots).toEqual({ index: false, follow: true });
    findPublicRentalBySlug.mockResolvedValueOnce(rental());
    expect((await meta()).robots).toMatchObject({ index: true });
  });

  it("băng thông báo, badge, giá tham khảo mờ, form 'Nhận tư vấn căn tương tự', điều khoản thu gọn; vẫn gọi sale", async () => {
    findPublicRentalBySlug.mockResolvedValue(rented());
    const { container } = await renderRental();
    expect(screen.getByRole("status")).toHaveTextContent("Căn này đã được cho thuê. Xem các căn tương tự bên dưới");
    expect(screen.getAllByText("Đã thuê").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Giá tham khảo").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { level: 2, name: "Nhận tư vấn căn tương tự" })).toBeInTheDocument();
    expect(container.querySelector("#lead-form")).not.toBeNull();
    const accordion = container.querySelector("details") as HTMLDetailsElement;
    expect(accordion).not.toBeNull();
    expect(accordion.open).toBe(false);
    expect(screen.getByRole("link", { name: "Gọi 0901 111 222" })).toBeInTheDocument();
  });

  it("không JSON-LD nào (RealEstateListing lẫn breadcrumb)", async () => {
    findPublicRentalBySlug.mockResolvedValue(rented());
    const { container } = await renderRental();
    expect(container.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
  });

  it("tin tương tự nổi bật: ngay sau khối tiêu đề (h1), TRƯỚC nội dung, tiêu đề 'Căn tương tự đang trống'", async () => {
    findPublicRentalBySlug.mockResolvedValue(rented());
    findSimilarRentals.mockResolvedValue([rental({ id: "r2", title: "Căn hộ 1PN", slug: "can-ho-1pn" })]);
    const { container } = await renderRental();
    const section = screen.getByRole("heading", { level: 2, name: "Căn tương tự đang trống" }).closest("section") as HTMLElement;
    const h1 = container.querySelector("h1") as HTMLElement;
    expect(h1.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(section.compareDocumentPosition(container.querySelector("#details") as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(findSimilarRentals).toHaveBeenCalledWith({}, "vi", expect.objectContaining({ status: "rented" }));
  });
});

describe("không lộ địa chỉ/toạ độ chính xác khi showExactAddress = false", () => {
  const SECRET_ADDRESS = "12 Lê Lợi";

  it("HTML + props bản đồ + JSON-LD không chứa số nhà hay toạ độ thật; bản đồ nhận toạ độ đã làm tròn và approximate", async () => {
    // Khách thật không nhận `address`/`location` (field access); cố tình đưa vào để chứng minh trang vẫn không in ra.
    findPublicRentalBySlug.mockResolvedValue(rental({ address: SECRET_ADDRESS, location: [106.700981, 10.776889] }));
    findRentalPrivateFields.mockResolvedValue({ authorId: "s1", location: [106.700981, 10.776889] });
    const { container } = await renderRental();
    const html = container.innerHTML;
    expect(html).not.toContain(SECRET_ADDRESS);
    expect(html).not.toMatch(/106\.700981|10\.776889/);
    expect(lazyMapProps).toHaveLength(1);
    expect(lazyMapProps[0]).toMatchObject({ location: { lat: 10.777, lng: 106.701 }, approximate: true });
    expect(container.textContent).toContain("Phường Sài Gòn, TP.HCM");
  });

  it("address/location undefined (đúng như khách nhận từ Payload) → trang dựng bình thường, không 'undefined', không bản đồ nếu không có toạ độ", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental());
    const { container } = await renderRental();
    expect(container.textContent).not.toContain("undefined");
    expect(lazyMapProps).toHaveLength(0);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("showExactAddress = true → in địa chỉ đầy đủ và ghim chính xác (không approximate)", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental({ showExactAddress: true, address: SECRET_ADDRESS, location: [106.700981, 10.776889] }));
    const { container } = await renderRental();
    expect(container.textContent).toContain(`${SECRET_ADDRESS}, Phường Sài Gòn, TP.HCM`);
    expect(lazyMapProps[0]).toMatchObject({ location: { lat: 10.776889, lng: 106.700981 }, approximate: false });
  });
});

describe("JSON-LD tin còn trống", () => {
  it("RealEstateListing có giá VND/tháng, publisher Organization, URL tuyệt đối, ảnh; tiêu đề chứa </script> không phá thẻ", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental({ title: "A </script><script>alert(1)</script>" }));
    const { container } = await renderRental();
    const items = jsonLdItems(container);
    const listing = items.find((item) => item["@type"] === "RealEstateListing");
    expect(listing).toMatchObject({
      url: "https://tami.example/cho-thue/can-ho-2pn",
      inLanguage: "vi",
      datePosted: "2026-02-03T00:00:00.000Z",
      offers: { price: 12_000_000, priceCurrency: "VND" },
      publisher: { "@type": "Organization", name: "TAMI", url: "https://tami.example" },
    });
    expect(listing?.image).toEqual(["https://tami.example/api/media/file/g1-1600.webp", "https://tami.example/api/media/file/g2-1600.webp"]);
    expect(items.find((item) => item["@type"] === "BreadcrumbList")).toBeDefined();
    expect(container.querySelectorAll("script")).toHaveLength(items.length);
  });

  it("giá thoả thuận → hiện 'Thoả thuận', JSON-LD không khai offers", async () => {
    findPublicRentalBySlug.mockResolvedValue(rental({ priceNegotiable: true }));
    const { container } = await renderRental();
    expect(screen.getAllByText("Thoả thuận").length).toBeGreaterThanOrEqual(1);
    expect(jsonLdItems(container).find((item) => item["@type"] === "RealEstateListing")).not.toHaveProperty("offers");
  });
});

describe("metadata", () => {
  it("canonical theo ngôn ngữ, hreflang en chỉ khi có bản EN, og:image = ảnh đầu thư viện", async () => {
    findPublicRentalBySlug.mockResolvedValueOnce(rental({ hasEnglish: false }));
    const noEn = await meta();
    expect(noEn.alternates?.canonical).toBe("https://tami.example/cho-thue/can-ho-2pn");
    expect(noEn.alternates?.languages).toBeUndefined();
    expect(noEn.description).toBe("Căn hộ thoáng, đầy đủ nội thất.");
    expect((noEn.openGraph?.images as { url: string }[])[0]?.url).toBe("https://tami.example/api/media/file/g1.jpg");

    findPublicRentalBySlug.mockResolvedValueOnce(rental({ hasEnglish: true }));
    const withEn = await meta();
    expect(withEn.alternates?.languages).toMatchObject({ en: "https://tami.example/en/for-rent/two-bedroom", vi: "https://tami.example/cho-thue/can-ho-2pn" });
  });

  it("dự án đã populate nhưng chưa có bản EN: không link ở /en", async () => {
    const project = { id: "d1", title: "Dự án A", slug: "du-an-a", hasEnglish: false } as Project;
    findPublicRentalBySlug.mockResolvedValue(rental({ project, hasEnglish: true }));
    await renderRental("en", "two-bedroom");
    expect(screen.queryByRole("link", { name: "Dự án A" })).toBeNull();
  });
});
