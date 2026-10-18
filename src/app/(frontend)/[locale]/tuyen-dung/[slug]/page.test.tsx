import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { JobPosting, Province } from "@/payload-types";

const findPublicJobBySlug = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<Partial<JobPosting> | null>>());
const findOtherOpenJobs = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<Partial<JobPosting>[]>>());
const getSiteSettings = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/careers/job-queries", () => ({ findPublicJobBySlug, findOtherOpenJobs }));
vi.mock("@/lib/news/news-queries", () => ({ findLocalizedSlugs: async () => ({ vi: "chuyen-vien-tu-van", en: "real-estate-consultant" }) }));
vi.mock("@/lib/content/get-globals", () => ({ getSiteSettings }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
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

import JobDetailPage, { generateMetadata } from "./page";

const now = "2026-01-01T00:00:00.000Z";
// Hôm nay 17/10/2026 10:00 UTC = 17:00 ICT.
const NOW = new Date("2026-10-17T10:00:00.000Z");
const OPEN_DEADLINE = "2026-10-20T12:00:00.000Z";
const EXPIRED_DEADLINE = "2026-10-10T12:00:00.000Z";
const province: Province = { id: "p1", code: "01", name: "Thành phố Hà Nội", shortName: "Hà Nội", slug: "ha-noi", updatedAt: now, createdAt: now };

const lexical = (...paragraphs: string[]) => ({
  root: {
    type: "root",
    version: 1,
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    children: paragraphs.map((text) => ({
      type: "paragraph",
      version: 1,
      direction: "ltr" as const,
      format: "" as const,
      indent: 0,
      children: [{ type: "text", version: 1, text }],
    })),
  },
});

const job = (overrides: Partial<JobPosting> = {}): Partial<JobPosting> => ({
  id: "j1",
  title: "Chuyên viên tư vấn",
  slug: "chuyen-vien-tu-van",
  hasEnglish: false,
  province,
  workplace: "Văn phòng TAMI, Quận 1",
  employmentType: "full_time",
  salaryMinVnd: 15_000_000,
  salaryMaxVnd: 30_000_000,
  quantity: 5,
  deadline: OPEN_DEADLINE,
  publishedAt: "2026-10-01T03:00:00.000Z",
  createdAt: "2026-09-30T03:00:00.000Z",
  description: lexical("Tư vấn khách hàng."),
  requirements: lexical("Giao tiếp tốt."),
  benefits: lexical("Hoa hồng cao."),
  ...overrides,
});

const params = (locale: string, slug = "chuyen-vien-tu-van") => ({ params: Promise.resolve({ locale, slug }) });

async function renderJob(locale: "vi" | "en" = "vi", slug = "chuyen-vien-tu-van") {
  const ui = await JobDetailPage(params(locale, slug));
  return renderWithIntl(ui, locale);
}

const jsonLdItems = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map((node) => JSON.parse(node.textContent ?? "null") as Record<string, unknown>);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  // Radix Checkbox trong form ứng tuyển đo ô input ẩn bằng ResizeObserver (jsdom không có).
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  getSiteSettings.mockResolvedValue({ hotline: "0901 234 567", email: "tuyendung@tami.example" });
  findOtherOpenJobs.mockResolvedValue([]);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  findPublicJobBySlug.mockReset();
  findOtherOpenJobs.mockReset();
  getSiteSettings.mockReset();
});

describe("trang chi tiết tuyển dụng (S13): tin còn hạn", () => {
  it("một h1; Mô tả / Yêu cầu / Quyền lợi là h2; vùng form ứng tuyển #apply-form kèm email + hotline; nút Ứng tuyển và thanh dính cuộn tới form", async () => {
    findPublicJobBySlug.mockResolvedValue(job());
    const { container } = await renderJob();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Chuyên viên tư vấn" })).toBeInTheDocument();
    const h2s = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(h2s).toEqual(["Thông tin tuyển dụng", "Mô tả công việc", "Yêu cầu ứng viên", "Quyền lợi", "Ứng tuyển vị trí này"]);
    const form = container.querySelector("#apply-form") as HTMLElement;
    expect(form).not.toBeNull();
    // Form ứng tuyển thật (S13) nằm trong vùng này; email + hotline là kênh dự phòng dưới form.
    expect(within(form).getByLabelText(/Họ và tên/)).toBeInTheDocument();
    expect(within(form).getByLabelText(/CV/)).toBeInTheDocument();
    expect(within(form).getByRole("button", { name: "Ứng tuyển" })).toBeInTheDocument();
    expect(within(form).getByRole("link", { name: "Gửi CV tới tuyendung@tami.example" })).toHaveAttribute("href", "mailto:tuyendung@tami.example");
    expect(within(form).getByRole("link", { name: "0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    for (const link of screen.getAllByRole("link", { name: "Ứng tuyển" })) expect(link).toHaveAttribute("href", "#apply-form");
    expect(screen.queryByText("Vị trí đã hết hạn nhận hồ sơ")).toBeNull();
  });

  it("tóm tắt hiện nơi làm, hình thức, số lượng, lương và hạn nộp theo ngày", async () => {
    findPublicJobBySlug.mockResolvedValue(job());
    await renderJob();
    const summary = screen.getByRole("heading", { level: 2, name: "Thông tin tuyển dụng" }).closest("aside") as HTMLElement;
    expect(within(summary).getByText("Văn phòng TAMI, Quận 1, Hà Nội")).toBeInTheDocument();
    expect(within(summary).getByText("Toàn thời gian")).toBeInTheDocument();
    expect(within(summary).getByText("5 người")).toBeInTheDocument();
    expect(within(summary).getByText("15 triệu – 30 triệu")).toBeInTheDocument();
    expect(within(summary).getByText("20/10/2026")).toBeInTheDocument();
  });

  it("JSON-LD JobPosting: validThrough cuối ngày hạn giờ VN, baseSalary min/max theo tháng, inLanguage, URL tuyệt đối, mô tả HTML; kèm BreadcrumbList", async () => {
    findPublicJobBySlug.mockResolvedValue(job({ title: "A </script><script>alert(1)</script>" }));
    const { container } = await renderJob();
    const items = jsonLdItems(container);
    const posting = items.find((item) => item["@type"] === "JobPosting");
    expect(posting).toMatchObject({
      url: "https://tami.example/tuyen-dung/chuyen-vien-tu-van",
      inLanguage: "vi",
      datePosted: "2026-10-01T03:00:00.000Z",
      validThrough: "2026-10-20T23:59:59+07:00",
      employmentType: "FULL_TIME",
      hiringOrganization: { name: "TAMI" },
      jobLocation: { address: { addressCountry: "VN", addressLocality: "Hà Nội", streetAddress: "Văn phòng TAMI, Quận 1" } },
      baseSalary: { currency: "VND", value: { minValue: 15_000_000, maxValue: 30_000_000, unitText: "MONTH" } },
    });
    expect(posting?.description).toBe(
      "<h2>Mô tả công việc</h2><p>Tư vấn khách hàng.</p><h2>Yêu cầu ứng viên</h2><p>Giao tiếp tốt.</p><h2>Quyền lợi</h2><p>Hoa hồng cao.</p>",
    );
    expect(items.find((item) => item["@type"] === "BreadcrumbList")).toBeDefined();
    expect(container.querySelectorAll("script")).toHaveLength(items.length);
    expect(container.querySelector("script[type='application/ld+json']")?.innerHTML).not.toContain("</script>");
  });

  it("hạn nộp là hôm nay (giờ VN) vẫn là tin còn hạn; hạn hôm qua là hết hạn", async () => {
    findPublicJobBySlug.mockResolvedValueOnce(job({ deadline: "2026-10-17T12:00:00.000Z" }));
    const { container, unmount } = await renderJob();
    expect(container.querySelector("#apply-form")).not.toBeNull();
    unmount();
    findPublicJobBySlug.mockResolvedValueOnce(job({ deadline: "2026-10-16T12:00:00.000Z" }));
    const expired = await renderJob();
    expect(expired.container.querySelector("#apply-form")).toBeNull();
  });

  it("không có lương, nơi làm hay số lượng → bỏ các dòng đó và baseSalary; jobLocation chỉ còn quốc gia", async () => {
    findPublicJobBySlug.mockResolvedValue(
      job({ salaryMinVnd: null, salaryMaxVnd: null, salaryText: "Thỏa thuận", province: null, workplace: null, quantity: null }),
    );
    const { container } = await renderJob();
    expect(screen.queryByText("Nơi làm việc")).toBeNull();
    expect(screen.queryByText("Số lượng")).toBeNull();
    expect(screen.getByText("Thỏa thuận")).toBeInTheDocument();
    const posting = jsonLdItems(container).find((item) => item["@type"] === "JobPosting");
    expect(posting?.baseSalary).toBeUndefined();
    expect(posting?.jobLocation).toEqual({ "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "VN" } });
  });

  it("richText khối quyền lợi rỗng → không có h2 mồ côi", async () => {
    findPublicJobBySlug.mockResolvedValue(job({ benefits: lexical("") }));
    await renderJob();
    expect(screen.queryByRole("heading", { level: 2, name: "Quyền lợi" })).toBeNull();
  });

  it("site-settings lỗi (DB tắt) → trang vẫn dựng, form chỉ không có email/hotline", async () => {
    findPublicJobBySlug.mockResolvedValue(job());
    getSiteSettings.mockRejectedValue(new Error("db down"));
    await renderJob();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Gửi CV tới/ })).toBeNull();
  });

  it("metadata: canonical, hreflang en chỉ khi có bản EN, index ở production, noindex,nofollow ngoài production", async () => {
    findPublicJobBySlug.mockResolvedValueOnce(job({ hasEnglish: false }));
    const outside = await generateMetadata(params("vi"));
    expect(outside.alternates?.canonical).toBe("https://tami.example/tuyen-dung/chuyen-vien-tu-van");
    expect(outside.alternates?.languages).toBeUndefined();
    expect(outside.robots).toMatchObject({ index: false, follow: false });

    vi.stubEnv("APP_ENV", "production");
    findPublicJobBySlug.mockResolvedValueOnce(job({ hasEnglish: true }));
    const live = await generateMetadata(params("vi"));
    expect(live.robots).toMatchObject({ index: true, follow: true });
    expect(live.alternates?.languages).toMatchObject({
      vi: "https://tami.example/tuyen-dung/chuyen-vien-tu-van",
      en: "https://tami.example/en/careers/real-estate-consultant",
    });
    expect(live.description).toBe("Tư vấn khách hàng.");
  });
});

describe("trang chi tiết tuyển dụng (S13): tin hết hạn vẫn mở", () => {
  const expiredJob = (overrides: Partial<JobPosting> = {}) => job({ deadline: EXPIRED_DEADLINE, ...overrides });

  it("băng 'đã hết hạn', không form, không nút/thanh Ứng tuyển, không JSON-LD nào (kể cả breadcrumb)", async () => {
    findPublicJobBySlug.mockResolvedValue(expiredJob());
    const { container } = await renderJob();
    expect(screen.getByRole("heading", { level: 1, name: "Chuyên viên tư vấn" })).toBeInTheDocument();
    const banner = screen.getByText("Vị trí đã hết hạn nhận hồ sơ").closest("[role=status]") as HTMLElement;
    expect(banner).not.toBeNull();
    expect(within(banner).getByRole("link", { name: "Xem tất cả vị trí" })).toHaveAttribute("href", "/tuyen-dung");
    expect(container.querySelector("#apply-form")).toBeNull();
    expect(screen.queryByRole("link", { name: "Ứng tuyển" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Ứng tuyển vị trí này" })).toBeNull();
    expect(container.querySelectorAll("script")).toHaveLength(0);
    expect(screen.getByText("10/10/2026")).toBeInTheDocument();
  });

  it("noindex, follow theo nội dung (production) và noindex ngoài production; canonical vẫn là chính trang", async () => {
    vi.stubEnv("APP_ENV", "production");
    findPublicJobBySlug.mockResolvedValueOnce(expiredJob());
    const metadata = await generateMetadata(params("vi"));
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("https://tami.example/tuyen-dung/chuyen-vien-tu-van");
    vi.stubEnv("APP_ENV", "staging");
    findPublicJobBySlug.mockResolvedValueOnce(expiredJob());
    expect((await generateMetadata(params("vi"))).robots).toMatchObject({ index: false, follow: false });
  });

  it("gợi ý vị trí đang tuyển khác bằng thẻ h3 là link; không gợi ý khi không có", async () => {
    findPublicJobBySlug.mockResolvedValue(expiredJob());
    findOtherOpenJobs.mockResolvedValue([job({ id: "j2", title: "Thực tập Marketing", slug: "thuc-tap-marketing", employmentType: "internship" })]);
    const { unmount } = await renderJob();
    const others = screen.getByRole("heading", { level: 2, name: "Vị trí đang tuyển khác" }).closest("section") as HTMLElement;
    expect(within(others).getByRole("heading", { level: 3, name: "Thực tập Marketing" })).toBeInTheDocument();
    expect(within(others).getByRole("link")).toHaveAttribute("href", "/tuyen-dung/thuc-tap-marketing");
    expect(findOtherOpenJobs).toHaveBeenCalledWith({}, "vi", "j1", expect.any(Date));
    unmount();
    findOtherOpenJobs.mockResolvedValue([]);
    await renderJob();
    expect(screen.queryByRole("heading", { name: "Vị trí đang tuyển khác" })).toBeNull();
  });

  it("tin còn hạn không truy vấn gợi ý vị trí khác", async () => {
    findPublicJobBySlug.mockResolvedValue(job());
    await renderJob();
    expect(findOtherOpenJobs).not.toHaveBeenCalled();
  });
});

describe("trang chi tiết tuyển dụng (S13): 404, ngôn ngữ", () => {
  it("EN chưa dịch / chưa công khai / slug lạ → notFound (404), metadata rỗng", async () => {
    findPublicJobBySlug.mockResolvedValue(null);
    await expect(JobDetailPage(params("en", "chua-dich"))).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    await expect(JobDetailPage(params("vi", "khong-co"))).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(await generateMetadata(params("en", "chua-dich"))).toEqual({});
    expect(findPublicJobBySlug).toHaveBeenCalledWith({}, "en", "chua-dich");
  });

  it("locale sai → notFound", async () => {
    await expect(JobDetailPage(params("fr", "x"))).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(findPublicJobBySlug).not.toHaveBeenCalled();
  });

  it("/en: khung tiếng Anh, không còn chữ Việt ngoài dữ liệu; JSON-LD inLanguage en; breadcrumb về /en/careers", async () => {
    findPublicJobBySlug.mockResolvedValue(
      job({
        title: "Real estate consultant",
        slug: "real-estate-consultant",
        hasEnglish: true,
        province: { ...province, shortName: "Hanoi", name: "Hanoi" },
        workplace: "TAMI office, District 1",
        description: lexical("Advise customers."),
        requirements: lexical("Good communication."),
        benefits: lexical("High commission."),
      }),
    );
    const { container } = await renderJob("en", "real-estate-consultant");
    expect(screen.getByRole("heading", { level: 2, name: "Job description" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Apply for this position" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Careers" })).toHaveAttribute("href", "/en/careers");
    expect(screen.getByText("15 million VND – 30 million VND")).toBeInTheDocument();
    expect(jsonLdItems(container).find((item) => item["@type"] === "JobPosting")).toMatchObject({
      inLanguage: "en",
      url: "https://tami.example/en/careers/real-estate-consultant",
    });
    expect(container.textContent).not.toMatch(/[ạảãàáâấầẩẫậăắằẳẵặẹẻẽèéêếềểễệịỉĩìíọỏõòóôốồổỗộơớờởỡợụủũùúưứừửữựỳỵỷỹýđ]/i);
  });
});
