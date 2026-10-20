import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { Breadcrumb } from "./Breadcrumb";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example"));
afterEach(() => vi.unstubAllEnvs());

function jsonLd(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent ?? "null") as {
    "@type": string;
    itemListElement: unknown[];
  };
}

describe("Breadcrumb", () => {
  it("nav có tên, mục cuối aria-current và không là link, các mục trước là link", () => {
    renderWithIntl(
      <Breadcrumb items={[{ label: "Dự án", href: "/du-an" }, { label: "Tami Riverside", href: "/du-an/tami-riverside" }]} />,
    );
    const nav = screen.getByRole("navigation", { name: /Breadcrumb/ });
    expect(within(nav).getByRole("link", { name: "Trang chủ" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "Dự án" })).toHaveAttribute("href", "/du-an");
    const current = nav.querySelector('[aria-current="page"]');
    expect(current).toHaveTextContent("Tami Riverside");
    expect(current?.closest("a")).toBeNull();
  });

  it("BL-037: link hover đổi màu accent, không gạch chân", () => {
    renderWithIntl(<Breadcrumb items={[{ label: "Dự án", href: "/du-an" }, { label: "X", href: "/du-an/x" }]} />);
    const link = screen.getByRole("link", { name: "Dự án" });
    expect(link).toHaveClass("hover:text-accent-text");
    expect(link).not.toHaveClass("hover:underline");
  });

  it("JSON-LD BreadcrumbList có URL tuyệt đối theo ngôn ngữ", () => {
    const { container } = renderWithIntl(
      <Breadcrumb
        items={[{ label: "Projects", href: "/en/projects" }, { label: "Tami Riverside", href: "/en/projects/tami-riverside" }]}
      />,
      "en",
    );
    const data = jsonLd(container);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tami.example/en" },
      { "@type": "ListItem", position: 2, name: "Projects", item: "https://tami.example/en/projects" },
      { "@type": "ListItem", position: 3, name: "Tami Riverside", item: "https://tami.example/en/projects/tami-riverside" },
    ]);
    expect(container.textContent).not.toMatch(/Trang chủ|Dự án/);
  });

  it("quá 3 mục: có link mục cha cho mobile và danh sách đầy đủ ẩn ở < md", () => {
    renderWithIntl(
      <Breadcrumb
        items={[
          { label: "Cho thuê", href: "/cho-thue" },
          { label: "Căn hộ", href: "/cho-thue/danh-muc/can-ho" },
          { label: "Studio", href: "/cho-thue/danh-muc/studio" },
        ]}
      />,
    );
    const back = screen.getByRole("link", { name: /Quay lại Căn hộ/ });
    expect(back).toHaveAttribute("href", "/cho-thue/danh-muc/can-ho");
    expect(back).toHaveClass("min-h-11", "md:hidden");
    expect(screen.getByRole("list")).toHaveClass("hidden", "md:flex");
  });

  it("overlay (BL-045): khung viên thuốc chỉ bao chữ (crumb-glass), chữ trắng, ngăn ›, mục hiện tại aria-current", () => {
    renderWithIntl(<Breadcrumb variant="overlay" items={[{ label: "Dự án", href: "/du-an" }, { label: "Tami Riverside", href: "/du-an/tami-riverside" }]} />);
    const nav = screen.getByRole("navigation", { name: /Breadcrumb/ });
    expect(nav).toHaveClass("w-fit");
    const list = within(nav).getByRole("list");
    expect(list).toHaveClass("crumb-glass", "rounded-full", "text-on-dark", "w-fit");
    expect(list.textContent).toBe("Trang chủ›Dự án›Tami Riverside");
    for (const separator of list.querySelectorAll("li > span[aria-hidden]")) expect(separator).toHaveTextContent("›");
    expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent("Tami Riverside");
    expect(within(nav).getByRole("link", { name: "Dự án" })).toHaveClass("min-h-11", "hover:text-primary");
  });

  it("plain (BL-045): chữ muted trong container, ngăn ›, không khung kính", () => {
    renderWithIntl(<Breadcrumb variant="plain" items={[{ label: "Tin tức", href: "/tin-tuc" }, { label: "Bài", href: "/tin-tuc/bai" }]} />);
    const nav = screen.getByRole("navigation", { name: /Breadcrumb/ });
    expect(nav).toHaveClass("max-w-container", "text-text-muted");
    expect(within(nav).getByRole("list")).not.toHaveClass("crumb-glass");
    expect(within(nav).getByRole("list").textContent).toBe("Trang chủ›Tin tức›Bài");
  });

  it("overlay + quá 3 mục: link '← mục cha' < md cũng nằm trong khung kính; JSON-LD giữ nguyên", () => {
    const { container } = renderWithIntl(
      <Breadcrumb
        variant="overlay"
        items={[
          { label: "Cho thuê", href: "/cho-thue" },
          { label: "Căn hộ", href: "/cho-thue/danh-muc/can-ho" },
          { label: "Studio", href: "/cho-thue/danh-muc/studio" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /Quay lại Căn hộ/ })).toHaveClass("crumb-glass", "md:hidden");
    expect(jsonLd(container).itemListElement).toHaveLength(4);
  });

  it("mặc định (trang chưa chuyển) giữ kiểu cũ: caret icon, không crumb-glass", () => {
    renderWithIntl(<Breadcrumb items={[{ label: "Dự án", href: "/du-an" }]} />);
    expect(screen.getByRole("list")).not.toHaveClass("crumb-glass");
    expect(screen.getByRole("list").textContent).not.toContain("›");
  });

  it("không có NEXT_PUBLIC_SITE_URL thì bỏ JSON-LD", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const { container } = renderWithIntl(<Breadcrumb items={[{ label: "Dự án", href: "/du-an" }]} />);
    expect(container.querySelector("script")).toBeNull();
  });
});
