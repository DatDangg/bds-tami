import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { HomePageData } from "@/lib/home/load-home";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/json-ld";

const loadHomePage = vi.hoisted(() => vi.fn<(locale: string) => Promise<HomePageData>>());
vi.mock("@/lib/home/load-home", () => ({ loadHomePage }));

import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("nhúng JSON-LD Organization + WebSite; trang chủ rỗng (global lỗi) vẫn có đúng một h1", async () => {
    loadHomePage.mockResolvedValue({
      view: { hero: [], heroEyebrow: null, heroCaption: null, heroSearch: null, blocks: [] },
      siteName: "TAMI HOMES",
      structuredData: [
        buildOrganizationJsonLd({ name: "TAMI HOMES", siteUrl: "https://tami.test" }),
        buildWebSiteJsonLd({ locale: "vi", name: "TAMI HOMES", siteUrl: "https://tami.test/" }),
      ],
    });
    const { container } = renderWithIntl(await HomePage({ locale: "vi" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("TAMI HOMES");
    const types = [...container.querySelectorAll('script[type="application/ld+json"]')].map((node) => (JSON.parse(node.textContent ?? "{}") as { "@type": string })["@type"]);
    expect(types).toEqual(["Organization", "WebSite"]);
  });

  it("chưa có URL gốc (structuredData rỗng) thì không có script JSON-LD", async () => {
    loadHomePage.mockResolvedValue({ view: { hero: [], heroEyebrow: null, heroCaption: null, heroSearch: null, blocks: [] }, siteName: "TAMI", structuredData: [] });
    const { container } = renderWithIntl(await HomePage({ locale: "en" }), "en");
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});
