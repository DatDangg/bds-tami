import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { toPostCards, toPostDetailView, toPostOfferView } from "@/lib/posts/post-view";
import type { Media, PropertyPost } from "@/payload-types";
import { PostDetail } from "./PostDetail";

const leadFormProps = vi.hoisted(() => vi.fn());
vi.mock("@/components/leads/LeadForm", () => ({
  LeadForm: (props: unknown) => {
    leadFormProps(props);
    return <form aria-label="lead" />;
  },
}));

const iso = "2026-01-01T00:00:00.000Z";
const image = (id: string): Media => ({ ...fakeMedia(id), id, mimeType: "image/webp", updatedAt: iso, createdAt: iso }) as unknown as Media;
const richText = (text: string): PropertyPost["content"] =>
  ({ root: { type: "root", version: 1, direction: "ltr", format: "", indent: 0, children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text }] }] } }) as PropertyPost["content"];

const post = (overrides: Partial<PropertyPost> = {}): PropertyPost =>
  ({
    id: "p1",
    title: "Ưu đãi mùa thu",
    slug: "uu-dai-mua-thu",
    excerpt: "Giảm giá sâu",
    status: "published",
    cover: image("cover"),
    content: richText("Nội dung ưu đãi."),
    publishedAt: "2026-10-01T03:00:00.000Z",
    updatedAt: iso,
    createdAt: iso,
    ...overrides,
  }) as PropertyPost;

const NOW = new Date("2026-10-18T03:00:00.000Z");

function renderPost(doc: PropertyPost, { related = [] as PropertyPost[], shareUrl = "https://tami.example/tin-bds/uu-dai-mua-thu" } = {}) {
  return renderWithIntl(
    <PostDetail
      doc={doc}
      view={toPostDetailView(doc, "vi")}
      offer={toPostOfferView(doc, "vi", NOW, { project: null, rental: null })}
      related={toPostCards(related, "vi", NOW)}
      hotline={{ label: "0901 234 567", telHref: "tel:0901234567" }}
      ownPath="/tin-bds/uu-dai-mua-thu"
      shareUrl={shareUrl}
      consultBanner={<section data-testid="consult-banner" />}
    />,
  );
}

class FakeIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  leadFormProps.mockClear();
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("PostDetail (S09, khung chi tiết mới)", () => {
  it("form lead gửi với source=property_post và sourceId là id tin; đúng một form trong thẻ liên hệ", () => {
    const { container } = renderPost(post());
    expect(leadFormProps).toHaveBeenCalledWith(expect.objectContaining({ source: "property_post", sourceId: "p1" }));
    expect(container.querySelectorAll("form")).toHaveLength(1);
    expect(container.querySelector("aside")).toContainElement(container.querySelector("#lead-form") as HTMLElement);
  });

  it("các mục là thẻ riêng có eyebrow (Tổng quan, Nội dung), không thẻ bao ngoài; đúng một h1 nằm ngoài các thẻ", () => {
    const { container } = renderPost(post());
    const cards = container.querySelector("[data-section-style='cards']") as HTMLElement;
    expect(cards).not.toBeNull();
    for (const id of ["overview", "content"]) {
      const section = cards.querySelector(`#${id}`) as HTMLElement;
      expect(section.className).toContain("group-data-[section-style=cards]/detail:bg-surface");
      expect(section.querySelector("p.uppercase")).not.toBeNull();
    }
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(cards).not.toContainElement(screen.getByRole("heading", { level: 1 }));
  });

  it("ảnh bìa là ảnh lớn 1 ảnh (ảnh LCP), nút chia sẻ nằm ở khối tiêu đề", () => {
    const { container } = renderPost(post());
    const hero = container.querySelector("[data-detail-gallery]") as HTMLElement;
    expect(hero.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(1);
    expect(hero).not.toHaveAttribute("aria-roledescription");
    const titleCard = screen.getByRole("heading", { level: 1 }).closest("div[class*='rounded-[28px]']") as HTMLElement;
    expect(within(titleCard).getByRole("button", { name: "Chia sẻ" })).toBeInTheDocument();
  });

  it("Tin liên quan: nền trắng, slider thẻ, banner tư vấn nằm sau", () => {
    renderPost(post(), { related: [post({ id: "p2", title: "Tin khác", slug: "tin-khac" })] });
    const heading = screen.getByRole("heading", { level: 2, name: "Tin liên quan" });
    const section = heading.closest("section") as HTMLElement;
    expect(section.className).toContain("bg-surface");
    expect(within(section).getByRole("heading", { level: 3, name: "Tin khác" })).toBeInTheDocument();
    expect(heading.compareDocumentPosition(screen.getByTestId("consult-banner")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("không có bài liên quan → không dựng khối rỗng", () => {
    renderPost(post());
    expect(screen.queryByRole("heading", { name: "Tin liên quan" })).toBeNull();
  });
});
