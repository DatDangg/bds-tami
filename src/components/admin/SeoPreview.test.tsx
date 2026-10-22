import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  values: {} as Record<string, { value?: unknown }>,
  doc: { collectionSlug: "news" as string | undefined, globalSlug: undefined as string | undefined },
  siteName: undefined as unknown,
  locale: "vi" as string,
}));
vi.mock("@payloadcms/ui", () => ({
  useFormFields: (selector: (args: unknown[]) => unknown) => selector([state.values]),
  useDocumentInfo: () => state.doc,
  useLocale: () => state.locale,
  usePayloadAPI: () => [{ data: state.siteName ? { siteName: state.siteName } : undefined, isLoading: false, isError: false }, { setParams: vi.fn() }],
}));

import { SeoPreview } from "./SeoPreview";

const setValues = (values: Record<string, unknown>) => {
  state.values = Object.fromEntries(Object.entries(values).map(([path, value]) => [path, { value }]));
};

const lexical = (text: string) => ({ root: { children: [{ type: "text", text }] } });

/** Gốc site trong jsdom = http://localhost:3000 (URL mặc định của môi trường test). */
const ORIGIN = "http://localhost:3000";

describe("SeoPreview", () => {
  it("ô SEO trống thì lấy Tiêu đề + Tóm tắt (Tin tức = excerpt) + nối tên website + URL thật của trang", () => {
    state.doc = { collectionSlug: "news", globalSlug: undefined };
    state.siteName = "Tami Land";
    state.locale = "vi";
    setValues({ title: "Tiêu đề bài", excerpt: "Tóm tắt bài viết", slug: "bai-viet" });
    render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText("Tiêu đề bài | Tami Land")).toBeInTheDocument();
    expect(screen.getByText("Tóm tắt bài viết")).toBeInTheDocument();
    expect(screen.getByText(`${ORIGIN}/tin-tuc/bai-viet`)).toBeInTheDocument();
    expect(screen.getByText(/Không bắt buộc/)).toBeInTheDocument();
  });

  it("Dự án dùng summary, Cho thuê dùng description (richText → chữ thuần)", () => {
    state.doc = { collectionSlug: "projects", globalSlug: undefined };
    state.siteName = "Tami Land";
    state.locale = "vi";
    setValues({ title: "Dự án A", summary: "Mô tả ngắn dự án", slug: "du-an-a" });
    const projects = render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText("Mô tả ngắn dự án")).toBeInTheDocument();
    projects.unmount();

    state.doc = { collectionSlug: "rentals", globalSlug: undefined };
    setValues({ title: "Nhà cho thuê", description: lexical("Nhà 3 phòng ngủ   mặt tiền"), slug: "nha-a" });
    render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText("Nhà 3 phòng ngủ mặt tiền")).toBeInTheDocument();
    expect(screen.getByText(`${ORIGIN}/cho-thue/nha-a`)).toBeInTheDocument();
  });

  it("có giá trị SEO thì thắng fallback; canonical nhập tay thắng URL trang", () => {
    state.doc = { collectionSlug: "news", globalSlug: undefined };
    state.siteName = "Tami Land";
    state.locale = "vi";
    setValues({ title: "Tiêu đề bài", "seo.metaTitle": "Tiêu đề SEO", "seo.metaDescription": "Mô tả SEO", "seo.canonical": "https://khac.vn/x", slug: "bai" });
    render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText("Tiêu đề SEO | Tami Land")).toBeInTheDocument();
    expect(screen.getByText("Mô tả SEO")).toBeInTheDocument();
    expect(screen.getByText("https://khac.vn/x")).toBeInTheDocument();
  });

  it("tiếng Anh dùng đường dẫn dịch + tiền tố /en CHỈ khi đã có bản dịch EN; trang pháp lý dùng đường dẫn theo kind", () => {
    state.doc = { collectionSlug: "projects", globalSlug: undefined };
    state.siteName = "Tami Land";
    state.locale = "en";
    setValues({ title: "Project A", slug: "a", hasEnglish: true });
    const en = render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText(`${ORIGIN}/en/projects/a`)).toBeInTheDocument();
    en.unmount();

    // Chưa bật bản dịch EN: vẫn hiện đường dẫn tiếng Việt (trang EN không tồn tại).
    setValues({ title: "Dự án A", slug: "a", hasEnglish: false });
    const noEn = render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText(`${ORIGIN}/du-an/a`)).toBeInTheDocument();
    expect(screen.queryByText(`${ORIGIN}/en/projects/a`)).toBeNull();
    noEn.unmount();

    state.doc = { collectionSlug: "pages", globalSlug: undefined };
    state.locale = "vi";
    setValues({ title: "Chính sách", kind: "privacy" });
    render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText(`${ORIGIN}/chinh-sach-bao-mat`)).toBeInTheDocument();
    expect(screen.getByText("Mô tả trang sẽ hiện ở đây khi có nội dung.")).toBeInTheDocument();
  });

  it("Trang chủ: canonical là gốc site (không có ô Tiêu đề bản ghi)", () => {
    state.doc = { collectionSlug: undefined, globalSlug: "homepage" };
    state.siteName = "Tami Land";
    state.locale = "vi";
    setValues({ "seo.metaTitle": "Tami Land - Bất động sản" });
    render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText("Tami Land - Bất động sản")).toBeInTheDocument();
    expect(screen.getByText(`${ORIGIN}`)).toBeInTheDocument();
  });

  it("Trang chủ SEO trống: lấy bản dịch page.home.title / description theo ngôn ngữ đang sửa (vi + en), nối tên website", async () => {
    const { default: viMessages } = await import("@/i18n/messages/vi.json");
    const { default: enMessages } = await import("@/i18n/messages/en.json");
    state.doc = { collectionSlug: undefined, globalSlug: "homepage" };
    state.siteName = "Tami Land";
    state.locale = "vi";
    setValues({ "seo.metaTitle": "", "seo.metaDescription": "  " });
    const vi_ = render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText(`${viMessages.page.home.title} | Tami Land`)).toBeInTheDocument();
    expect(screen.getByText(viMessages.page.home.description)).toBeInTheDocument();
    expect(screen.queryByText("Tiêu đề trang")).toBeNull();
    vi_.unmount();

    state.locale = "en";
    render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText(`${enMessages.page.home.title} | Tami Land`)).toBeInTheDocument();
    expect(screen.getByText(enMessages.page.home.description)).toBeInTheDocument();
    expect(screen.getByText(`${ORIGIN}/en`)).toBeInTheDocument();
  });

  it("chưa có dữ liệu (Cài đặt chung chưa tải, chưa nhập slug) thì hiện câu mẫu, không bịa tên website/URL", () => {
    state.doc = { collectionSlug: "news", globalSlug: undefined };
    state.siteName = undefined;
    state.locale = "vi";
    setValues({});
    render(<SeoPreview path="seo.metaTitle" />);
    expect(screen.getByText("Tiêu đề trang")).toBeInTheDocument();
    expect(screen.getByText("Đường dẫn sẽ có sau khi lưu trang")).toBeInTheDocument();
    expect(screen.getByText("Mô tả trang sẽ hiện ở đây khi có nội dung.")).toBeInTheDocument();
  });
});
