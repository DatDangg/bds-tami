import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { isPastDeadline } from "@/lib/careers/deadline";
import type { Category, JobPosting, Province } from "@/payload-types";

const now = "2026-01-01T00:00:00.000Z";
// Hôm nay 17/10/2026 10:00 UTC = 17:00 ICT.
const NOW = new Date("2026-10-17T10:00:00.000Z");
const category = (id: string, name: string, slug: string, overrides: Partial<Category> = {}): Category => ({
  id,
  name,
  slug,
  scope: "job",
  hasEnglish: false,
  updatedAt: now,
  createdAt: now,
  ...overrides,
});
const province = (id: string, name: string, slug: string): Province => ({ id, code: id, name, shortName: name, slug, updatedAt: now, createdAt: now });

const sales = category("c1", "Kinh doanh", "kinh-doanh", { hasEnglish: true });
const marketing = category("c2", "Marketing", "marketing");
const hanoi = province("p1", "Hà Nội", "ha-noi");
const hcm = province("p2", "Hồ Chí Minh", "ho-chi-minh");

interface Fixture {
  doc: JobPosting;
  hasEnglish: boolean;
}
const fixture = (id: string, title: string, deadline: string, categoryDoc: Category | null, provinceDoc: Province, hasEnglish: boolean, extra: Partial<JobPosting> = {}): Fixture => ({
  hasEnglish,
  doc: {
    id,
    title,
    slug: `slug-${id}`,
    status: "published",
    employmentType: "full_time",
    deadline,
    province: provinceDoc,
    category: categoryDoc,
    author: "a",
    updatedAt: now,
    createdAt: now,
    ...extra,
  } as JobPosting,
});
const fixtures: Fixture[] = [
  fixture("1", "Tư vấn BĐS", "2026-11-30T12:00:00.000Z", sales, hcm, true, { salaryMinVnd: 15_000_000, salaryMaxVnd: 30_000_000 }),
  fixture("2", "Thực tập Marketing", "2026-10-19T12:00:00.000Z", marketing, hanoi, true, { employmentType: "internship", salaryText: "Thỏa thuận" }),
  fixture("3", "Chăm sóc khách hàng", "2026-10-17T12:00:00.000Z", null, hanoi, false, { employmentType: "part_time" }),
  fixture("4", "Trưởng nhóm đã đóng", "2026-10-16T12:00:00.000Z", sales, hcm, true),
];

const listOpenJobs = vi.hoisted(() => vi.fn());
const getSiteSettings = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
const loadPageBanner = vi.hoisted(() => vi.fn<(locale: string, key: string) => Promise<{ url: string; width: number } | undefined>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({}) }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-page-banner", () => ({ loadPageBanner }));
vi.mock("@/lib/content/get-globals", () => ({ getSiteSettings }));
vi.mock("@/lib/projects/project-queries", () => ({ listProvinces: async () => [hanoi, hcm] }));
vi.mock("@/lib/careers/job-queries", () => ({
  listRootJobCategories: async (_payload: unknown, locale: string) => ({ docs: [sales, marketing].filter((item) => locale === "vi" || item.hasEnglish) }),
  listChildJobCategories: async () => ({ docs: [] }),
  findJobCategoryBySlug: async (_payload: unknown, locale: string, slug: string) => {
    const found = [sales, marketing].find((item) => item.slug === slug);
    return found && (locale === "vi" || found.hasEnglish) ? found : null;
  },
  listOpenJobs,
}));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: vi } = await import("@/i18n/messages/vi.json");
  const { default: en } = await import("@/i18n/messages/en.json");
  const messages = { vi, en };
  return {
    getTranslations: async ({ locale, namespace }: { locale: "vi" | "en"; namespace: string }) =>
      createTranslator({ locale, messages: messages[locale], namespace: namespace as never }),
  };
});

import { JobListPage, buildJobListMetadata } from "./JobListPage";

/** Mô phỏng `listOpenJobs` thật (đã kiểm bằng DB ở tests/integration/job-postings.test.ts): bỏ tin quá hạn theo `now` trang truyền vào. */
listOpenJobs.mockImplementation(
  async (_payload: unknown, locale: string, query: { page: number; now: Date; categoryIds?: string[]; provinceId?: string }) => {
    const matched = fixtures
      .filter((item) => locale === "vi" || item.hasEnglish)
      .map((item) => item.doc)
      .filter((doc) => !isPastDeadline(doc.deadline, query.now))
      .filter((doc) => !query.categoryIds || query.categoryIds.includes((doc.category as Category | null)?.id ?? ""))
      .filter((doc) => !query.provinceId || (doc.province as Province).id === query.provinceId);
    return { docs: matched, page: query.page, limit: 12, totalDocs: matched.length, totalPages: Math.max(1, Math.ceil(matched.length / 12)), hasNextPage: false, hasPrevPage: false };
  },
);

async function render(locale: "vi" | "en", searchParams: Record<string, string> = {}) {
  const ui = await JobListPage({ locale, searchParams });
  return renderWithIntl(ui, locale);
}
const cardTitles = () => screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
const chipNav = () => screen.getByRole("navigation", { name: /Nhóm công việc|Job categories/ });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  getSiteSettings.mockResolvedValue({ email: "tuyendung@tami.example" });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  listOpenJobs.mockClear();
  notFound.mockClear();
  getSiteSettings.mockReset();
});

describe("S12 /tuyen-dung: render", () => {
  it("chỉ vị trí còn hạn (tin hết hạn hôm qua giờ VN bị ẩn, hạn hôm nay vẫn hiện), một h1, mỗi hàng h2 là link, đếm kết quả aria-live", async () => {
    await render("vi");
    expect(screen.getByRole("heading", { level: 1, name: "Tuyển dụng" })).toBeInTheDocument();
    expect(cardTitles()).toEqual(["Tư vấn BĐS", "Thực tập Marketing", "Chăm sóc khách hàng"]);
    expect(screen.queryByText("Trưởng nhóm đã đóng")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("3 vị trí đang tuyển");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("link", { name: /Tư vấn BĐS/ })).toHaveAttribute("href", "/tuyen-dung/slug-1");
    expect(listOpenJobs).toHaveBeenCalledWith({}, "vi", { page: 1, now: NOW });
  });

  it("thẻ: tỉnh · hình thức, lương (khoảng hoặc chữ), hạn nộp; còn ≤ 3 ngày có badge, hôm nay có badge riêng; còn xa thì không", async () => {
    await render("vi");
    const row = (title: RegExp) => screen.getByRole("link", { name: title });
    expect(row(/Tư vấn BĐS/)).toHaveTextContent("Hồ Chí Minh · Toàn thời gian");
    expect(row(/Tư vấn BĐS/)).toHaveTextContent("15 triệu – 30 triệu");
    expect(row(/Tư vấn BĐS/)).toHaveTextContent("Hạn nộp: 30/11/2026");
    expect(within(row(/Tư vấn BĐS/)).queryByText(/Còn \d+ ngày|Hạn nộp hôm nay/)).toBeNull();
    expect(row(/Thực tập Marketing/)).toHaveTextContent("Thỏa thuận");
    expect(within(row(/Thực tập Marketing/)).getByText("Còn 2 ngày")).toBeInTheDocument();
    expect(within(row(/Chăm sóc khách hàng/)).getByText("Hạn nộp hôm nay")).toBeInTheDocument();
  });

  it("lọc theo tỉnh: truy vấn đúng id tỉnh, select giữ giá trị, có nút xoá về /tuyen-dung", async () => {
    await render("vi", { province: "ho-chi-minh" });
    expect(listOpenJobs).toHaveBeenCalledWith({}, "vi", { page: 1, now: NOW, provinceId: "p2" });
    expect(cardTitles()).toEqual(["Tư vấn BĐS"]);
    expect(document.querySelector("input[name=province]")).toHaveValue("ho-chi-minh");
    expect(screen.getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/tuyen-dung");
  });

  it("?category= hợp lệ lọc theo nhóm, chip hiện tại aria-current, giữ category bằng input ẩn; slug lạ bị bỏ qua", async () => {
    const { container, unmount } = await render("vi", { category: "marketing", province: "ha-noi" });
    expect(listOpenJobs).toHaveBeenCalledWith({}, "vi", { page: 1, now: NOW, categoryIds: ["c2"], provinceId: "p1" });
    expect(cardTitles()).toEqual(["Thực tập Marketing"]);
    expect(container.querySelector("input[type=hidden][name=category]")).toHaveAttribute("value", "marketing");
    const links = within(chipNav()).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Tất cả", "/tuyen-dung?province=ha-noi"],
      ["Kinh doanh", "/tuyen-dung?category=kinh-doanh&province=ha-noi"],
      ["Marketing", "/tuyen-dung?category=marketing&province=ha-noi"],
    ]);
    expect(links.filter((link) => link.getAttribute("aria-current") === "page").map((link) => link.textContent)).toEqual(["Marketing"]);
    unmount();
    await render("vi", { category: "khong-co" });
    expect(cardTitles()).toHaveLength(3);
    expect(screen.queryByRole("link", { name: "Xoá bộ lọc" })).toBeNull();
  });

  it("không có vị trí nào, không lọc: 'Hiện TAMI chưa có vị trí đang tuyển.' + Gửi CV tới email (mailto)", async () => {
    listOpenJobs.mockResolvedValueOnce({ docs: [], page: 1, limit: 12, totalDocs: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
    await render("vi");
    expect(screen.getByRole("status")).toHaveTextContent("Hiện TAMI chưa có vị trí đang tuyển.");
    expect(screen.getByRole("link", { name: "Gửi CV tới tuyendung@tami.example" })).toHaveAttribute("href", "mailto:tuyendung@tami.example");
  });

  it("không có vị trí và site-settings lỗi → vẫn dựng trang, chỉ không có link email", async () => {
    listOpenJobs.mockResolvedValueOnce({ docs: [], page: 1, limit: 12, totalDocs: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
    getSiteSettings.mockRejectedValue(new Error("db down"));
    await render("vi");
    expect(screen.getByRole("status")).toHaveTextContent("Hiện TAMI chưa có vị trí đang tuyển.");
    expect(screen.queryByRole("link", { name: /^Gửi CV tới/ })).toBeNull();
  });

  it("không có kết quả khi lọc: 'Chưa có vị trí phù hợp.', bộ lọc vẫn hiện, nút Xoá bộ lọc", async () => {
    await render("vi", { category: "marketing", province: "ho-chi-minh" });
    expect(screen.getByRole("status")).toHaveTextContent("Chưa có vị trí phù hợp.");
    expect(screen.getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/tuyen-dung");
    expect(screen.getByRole("form", { name: "Bộ lọc vị trí tuyển dụng" })).toBeInTheDocument();
  });

  it("/en: chỉ tin có bản EN và còn hạn, chip chỉ nhóm có EN, nhãn tiếng Anh, link /en/careers", async () => {
    await render("en");
    expect(listOpenJobs).toHaveBeenCalledWith({}, "en", { page: 1, now: NOW });
    expect(cardTitles()).toEqual(["Tư vấn BĐS", "Thực tập Marketing"]);
    expect(screen.getByRole("heading", { level: 1, name: "Careers" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("2 open positions");
    expect(within(chipNav()).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/en/careers", "/en/careers?category=kinh-doanh"]);
    expect(screen.getByRole("link", { name: /Tư vấn BĐS/ })).toHaveAttribute("href", "/en/careers/slug-1");
    expect(screen.getByRole("link", { name: /Thực tập Marketing/ })).toHaveTextContent("Internship");
    expect(screen.getByRole("link", { name: /Thực tập Marketing/ })).toHaveTextContent("2 days left");
  });

  it("trang vượt số trang → notFound; ?page=abc về trang 1", async () => {
    await expect(render("vi", { page: "5" })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
    await render("vi", { page: "abc" });
    expect(listOpenJobs).toHaveBeenLastCalledWith({}, "vi", { page: 1, now: NOW });
  });
});

describe("generateMetadata /tuyen-dung", () => {
  beforeEach(() => vi.stubEnv("APP_ENV", "production"));

  it("không lọc: indexable, canonical là chính nó (trang 2 kèm ?page=2), hreflang vi/en", async () => {
    const meta = await buildJobListMetadata({ locale: "vi", searchParams: {} });
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.alternates?.canonical).toBe("https://tami.example/tuyen-dung");
    expect(meta.alternates?.languages).toMatchObject({ vi: "https://tami.example/tuyen-dung", en: "https://tami.example/en/careers" });
    const page2 = await buildJobListMetadata({ locale: "vi", searchParams: { page: "2" } });
    expect(page2.alternates?.canonical).toBe("https://tami.example/tuyen-dung?page=2");
  });

  it("có bộ lọc (tỉnh hoặc category, hợp lệ hay lạ): noindex, follow và canonical về trang sạch; ?province= rỗng không tính", async () => {
    for (const searchParams of [{ province: "ha-noi", page: "2" }, { category: "marketing" }, { category: "khong-co" }]) {
      const meta = await buildJobListMetadata({ locale: "vi", searchParams });
      expect(meta.robots).toEqual({ index: false, follow: true });
      expect(meta.alternates?.canonical).toBe("https://tami.example/tuyen-dung");
    }
    expect((await buildJobListMetadata({ locale: "vi", searchParams: { province: "" } })).robots).toEqual({ index: true, follow: true });
    expect((await buildJobListMetadata({ locale: "en", searchParams: { category: "kinh-doanh" } })).alternates?.canonical).toBe("https://tami.example/en/careers");
  });
});

describe("ảnh banner trang danh sách (FR-ADM-20)", () => {
  afterEach(() => loadPageBanner.mockReset());

  it("có ảnh → biến thể Ảnh (scrim riêng), loader gọi đúng key \"careers\"", async () => {
    loadPageBanner.mockResolvedValue({ url: "/api/media/file/banner.jpg", width: 1600 });
    const { container } = await render("vi");
    expect(loadPageBanner).toHaveBeenCalledWith("vi", "careers");
    expect(container.querySelector(".bg-banner-scrim")).not.toBeNull();
    expect(container.querySelector("section.bg-dark-deep img")).not.toBeNull();
  });

  it("không có ảnh (hoặc đọc lỗi) → banner chữ như trước", async () => {
    loadPageBanner.mockResolvedValue(undefined);
    const { container } = await render("vi");
    expect(container.querySelector(".bg-banner-scrim")).toBeNull();
    expect(container.querySelector("section.bg-bg-alt")).not.toBeNull();
  });
});
