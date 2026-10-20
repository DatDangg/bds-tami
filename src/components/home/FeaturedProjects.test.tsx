import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { ProjectSlideView } from "@/lib/home/home-view";
import { FeaturedProjects } from "./FeaturedProjects";

const slide: ProjectSlideView = {
  id: "p1",
  title: "Dự án 1",
  href: "/du-an/du-an-1",
  eyebrow: null,
  provinceName: "Hà Nội",
  summary: "",
  image: fakeMedia("p1"),
  salesStatus: "selling",
  stats: { landAreaM2: null, totalUnits: null, handoverTime: null },
};

describe("FeaturedProjects (BL-044)", () => {
  it("đầu khối: eyebrow + tiêu đề + mô tả; nút Xem tất cả dự án về danh sách", () => {
    renderWithIntl(<FeaturedProjects title="Dự án nổi bật" eyebrow="Dự án nổi bật nhất" description="Danh sách dự án" slides={[slide]} />);
    expect(screen.getByText("Dự án nổi bật nhất")).toHaveClass("text-accent-text");
    expect(screen.getByRole("heading", { level: 2, name: "Dự án nổi bật" })).toBeInTheDocument();
    expect(screen.getByText("Danh sách dự án")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem tất cả dự án" })).toHaveAttribute("href", "/du-an");
  });

  it("thiếu eyebrow/mô tả (vd chưa có bản EN) → ẩn, không lấy chữ Việt", () => {
    renderWithIntl(<FeaturedProjects title="Featured" eyebrow={null} description={null} slides={[slide]} />, "en");
    expect(screen.queryByText("Dự án nổi bật nhất")).toBeNull();
    expect(document.querySelector(".text-lead, .text-eyebrow")).toBeNull();
    expect(screen.getByRole("link", { name: "View all projects" })).toBeInTheDocument();
  });
});
