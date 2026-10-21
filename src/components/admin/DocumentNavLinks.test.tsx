import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

interface MockDocInfo {
  collectionSlug?: string;
  id?: string;
  savedDocumentData?: Record<string, unknown>;
}
let mockDocInfo: MockDocInfo = {};
let mockLocale = "vi";
let mockDepth = 1;
vi.mock("@payloadcms/ui", () => ({
  useConfig: () => ({ config: { routes: { admin: "/admin" } } }),
  useDocumentInfo: () => mockDocInfo,
  useLocale: () => ({ code: mockLocale }),
  useEditDepth: () => mockDepth,
  Link: ({ children, className, href }: React.ComponentProps<"a"> & { prefetch?: boolean }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));

import { DocumentNavLinks } from "./DocumentNavLinks";

const SITE = "https://tami.example";
const publishedProject = { slug: "du-an-x", status: "published", hasEnglish: true };

afterEach(() => {
  mockDocInfo = {};
  mockLocale = "vi";
  mockDepth = 1;
});

describe("DocumentNavLinks (BL-051 A7)", () => {
  it("collection đã lưu + công khai: 'Quay lại danh sách' về danh sách và 'Xem trên website' mở tab mới an toàn", () => {
    mockDocInfo = { collectionSlug: "projects", id: "p1", savedDocumentData: publishedProject };
    render(<DocumentNavLinks siteUrl={SITE} />);
    expect(screen.getByRole("link", { name: /Quay lại danh sách/ }).getAttribute("href")).toBe("/admin/collections/projects");
    const site = screen.getByRole("link", { name: /Xem trên website/ });
    expect(site.getAttribute("href")).toBe(`${SITE}/du-an/du-an-x`);
    expect(site.getAttribute("target")).toBe("_blank");
    expect(site.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("đang sửa bản EN: URL /en + chỉ khi hasEnglish", () => {
    mockLocale = "en";
    mockDocInfo = { collectionSlug: "projects", id: "p1", savedDocumentData: { ...publishedProject, slug: "project-x" } };
    const { unmount } = render(<DocumentNavLinks siteUrl={SITE} />);
    expect(screen.getByRole("link", { name: /Xem trên website/ }).getAttribute("href")).toBe(`${SITE}/en/projects/project-x`);
    unmount();
    mockDocInfo = { collectionSlug: "projects", id: "p1", savedDocumentData: { ...publishedProject, hasEnglish: false } };
    render(<DocumentNavLinks siteUrl={SITE} />);
    expect(screen.queryByRole("link", { name: /Xem trên website/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Quay lại danh sách/ })).toBeTruthy();
  });

  it("doc nháp, đang tạo mới (chưa có id), hoặc collection không có trang công khai: không có 'Xem trên website'", () => {
    for (const info of [
      { collectionSlug: "news", id: "n1", savedDocumentData: { slug: "a", status: "draft" } },
      { collectionSlug: "news", savedDocumentData: undefined },
      { collectionSlug: "leads", id: "l1", savedDocumentData: { slug: "a", status: "published" } },
    ]) {
      mockDocInfo = info;
      const { unmount } = render(<DocumentNavLinks siteUrl={SITE} />);
      expect(screen.queryByRole("link", { name: /Xem trên website/ })).toBeNull();
      expect(screen.getByRole("link", { name: /Quay lại danh sách/ })).toBeTruthy();
      unmount();
    }
  });

  it("global (không có collectionSlug) và drawer sửa nhanh (editDepth > 1): không hiện gì", () => {
    mockDocInfo = { id: "g" };
    const { container, unmount } = render(<DocumentNavLinks siteUrl={SITE} />);
    expect(container.innerHTML).toBe("");
    unmount();
    mockDepth = 2;
    mockDocInfo = { collectionSlug: "projects", id: "p1", savedDocumentData: publishedProject };
    const drawer = render(<DocumentNavLinks siteUrl={SITE} />);
    expect(drawer.container.innerHTML).toBe("");
  });
});
