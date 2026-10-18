import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { ProjectCardData } from "@/lib/projects/project-view";
import { ProjectCard } from "./ProjectCard";
import { ProjectFilters } from "./ProjectFilters";

const card = (overrides: Partial<ProjectCardData> = {}): ProjectCardData => ({
  id: "d1",
  title: "Dự án Sông Sài Gòn",
  href: "/du-an/song-sai-gon",
  salesStatus: "selling",
  provinceName: "TP. Hồ Chí Minh",
  categoryName: "Căn hộ",
  priceFrom: "3,5 tỷ",
  cover: fakeMedia("anh-1"),
  ...overrides,
});

describe("ProjectCard", () => {
  it("cả thẻ là MỘT link phủ ảnh + chữ (không lồng link); tiêu đề h2 tối đa 2 dòng; badge, tỉnh, giá", () => {
    const { container } = renderWithIntl(<ProjectCard data={card()} />);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/du-an/song-sai-gon");
    const heading = within(link).getByRole("heading", { level: 2, name: "Dự án Sông Sài Gòn" });
    expect(heading.className).toContain("line-clamp-2");
    expect(link).toHaveTextContent("Đang mở bán");
    expect(link).toHaveTextContent("TP. Hồ Chí Minh");
    expect(link).toHaveTextContent("Từ 3,5 tỷ");
    expect(link.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("badge theo trạng thái: Sắp mở bán / Đã bàn giao (neutral); EN không còn chữ Việt trong nhãn", () => {
    const { unmount } = renderWithIntl(<ProjectCard data={card({ salesStatus: "upcoming" })} />);
    expect(screen.getByText("Sắp mở bán")).toHaveAttribute("data-variant", "primary");
    unmount();
    renderWithIntl(<ProjectCard data={card({ salesStatus: "handed_over" })} />);
    expect(screen.getByText("Đã bàn giao")).toHaveAttribute("data-variant", "neutral");
  });

  it("EN: nhãn tiếng Anh", () => {
    renderWithIntl(<ProjectCard data={card({ priceFrom: "3.5 billion VND" })} />, "en");
    expect(screen.getByText("Now selling")).toBeInTheDocument();
    expect(screen.getByText("From 3.5 billion VND")).toBeInTheDocument();
  });

  it("thiếu ảnh / tỉnh / giá: vẫn giữ khung ảnh, không render phần thiếu", () => {
    const { container } = renderWithIntl(<ProjectCard data={card({ cover: null, provinceName: null, priceFrom: null })} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[class~=\"aspect-[4/5]\"]")).not.toBeNull();
    expect(screen.queryByText(/Từ /)).toBeNull();
  });

  it("thẻ đầu (priority) tải ảnh ngay, thẻ khác lazy", () => {
    const first = renderWithIntl(<ProjectCard data={card()} priority />);
    expect(first.container.querySelector("img")).toHaveAttribute("fetchpriority", "high");
    first.unmount();
    const second = renderWithIntl(<ProjectCard data={card()} />);
    expect(second.container.querySelector("img")).toHaveAttribute("loading", "lazy");
  });
});

const provinces = [
  { slug: "ha-noi", name: "Hà Nội" },
  { slug: "da-nang", name: "Đà Nẵng" },
];

describe("ProjectFilters", () => {
  it("form GET về đúng trang, hai select có nhãn, chọn sẵn giá trị từ URL, nút Lọc", () => {
    const { container } = renderWithIntl(
      <ProjectFilters actionPath="/du-an" provinces={provinces} selectedProvince="da-nang" selectedStatus="upcoming" active />,
    );
    const form = screen.getByRole("form", { name: "Bộ lọc dự án" });
    // next/form: GET là mặc định của <form> nên không ghi `method`; vẫn là form GET thường khi không có JS.
    expect(form.getAttribute("method")).toBeNull();
    expect(form).toHaveAttribute("action", "/du-an");
    expect(screen.getByLabelText("Tỉnh/thành")).toHaveValue("da-nang");
    expect(screen.getByLabelText("Trạng thái")).toHaveValue("upcoming");
    expect(within(screen.getByLabelText("Trạng thái")).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Tất cả",
      "Sắp mở bán",
      "Đang mở bán",
      "Đã bàn giao",
    ]);
    expect(screen.getByRole("button", { name: "Lọc" })).toHaveAttribute("type", "submit");
    expect(container.querySelector("input[type=hidden]")).toBeNull();
  });

  it("nút Xoá bộ lọc là link thật về trang không tham số, chỉ hiện khi đang lọc", () => {
    const { unmount } = renderWithIntl(<ProjectFilters actionPath="/du-an" provinces={provinces} active />);
    expect(screen.getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/du-an");
    unmount();
    renderWithIntl(<ProjectFilters actionPath="/du-an" provinces={provinces} active={false} />);
    expect(screen.queryByRole("link", { name: "Xoá bộ lọc" })).toBeNull();
  });

  it("giữ ?category= bằng input ẩn; EN dùng nhãn tiếng Anh", () => {
    const { container } = renderWithIntl(<ProjectFilters actionPath="/en/projects" provinces={provinces} hiddenCategory="apartments" active={false} />, "en");
    expect(container.querySelector("input[type=hidden][name=category]")).toHaveAttribute("value", "apartments");
    expect(screen.getByLabelText("Province / city")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Now selling" })).toBeInTheDocument();
  });
});
