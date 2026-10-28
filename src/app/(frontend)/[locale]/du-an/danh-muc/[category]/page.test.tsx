import { beforeEach, describe, expect, it, vi } from "vitest";

const ProjectListPage = vi.hoisted(() => vi.fn(async () => null));
const buildProjectListMetadata = vi.hoisted(() => vi.fn(async () => ({ title: "x" })));
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("@/components/projects/ProjectListPage", () => ({ ProjectListPage, buildProjectListMetadata }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next-intl/server", () => ({ setRequestLocale: () => undefined }));

import ProjectCategoryPage, { dynamic, generateMetadata } from "./page";

const props = (locale: string, category: string, searchParams: Record<string, string> = {}) => ({
  params: Promise.resolve({ locale, category }),
  searchParams: Promise.resolve(searchParams),
});

beforeEach(() => {
  ProjectListPage.mockClear();
  buildProjectListMetadata.mockClear();
  notFound.mockClear();
});

describe("route /du-an/danh-muc/[category] (BL-090)", () => {
  it("render theo request (đọc searchParams), truyền slug danh mục khoá cho ProjectListPage", async () => {
    expect(dynamic).toBe("force-dynamic");
    const element = await ProjectCategoryPage(props("vi", "khu-do-thi", { province: "ha-noi" }));
    expect(element.props).toEqual({ locale: "vi", searchParams: { province: "ha-noi" }, categorySlug: "khu-do-thi" });
  });

  it("generateMetadata truyền slug + ngôn ngữ; ngôn ngữ lạ → metadata rỗng / notFound", async () => {
    await generateMetadata(props("en", "urban-areas"));
    expect(buildProjectListMetadata).toHaveBeenCalledWith({ locale: "en", searchParams: {}, categorySlug: "urban-areas" });
    expect(await generateMetadata(props("fr", "x"))).toEqual({});
    await expect(ProjectCategoryPage(props("fr", "x"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
