import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { ProjectCardData } from "@/lib/projects/project-view";
import { RichText } from "../RichText";

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const text = (value: string) => ({ type: "text", version: 1, text: value, format: 0 });
const paragraph = (value: string) => ({ type: "paragraph", version: 1, children: [text(value)] });
const doc = (...children: unknown[]) => ({ root: { type: "root", version: 1, children } });
const block = (fields: Record<string, unknown>) => ({ type: "block", version: 2, format: "", fields: { id: "b", blockName: "", ...fields } });
const stat = (items: unknown) => block({ blockType: "statHighlights", items });
const imageText = (fields: Record<string, unknown>) => block({ blockType: "imageText", image: { ...fakeMedia("song"), mimeType: "image/jpeg" }, text: "Căn hộ hướng sông", imagePosition: "left", ...fields });
const projectMention = (project: unknown = PROJECT_ID) => block({ blockType: "projectMention", project });

const card = (overrides: Partial<ProjectCardData> = {}): ProjectCardData => ({
  id: PROJECT_ID,
  title: "The Crown Bắc Ninh",
  href: "/du-an/the-crown",
  salesStatus: "selling",
  provinceName: "Bắc Ninh",
  categoryName: "Căn hộ cao cấp",
  cover: fakeMedia("crown"),
  productTypes: [],
  priceFromLabel: null,
  areaRangeLabel: null,
  handoverTime: null,
  summary: null,
  address: null,
  ...overrides,
});
const projects = (...cards: ProjectCardData[]) => new Map(cards.map((item) => [item.id, item]));

describe("RichText: khối Số liệu nổi bật (BL-054)", () => {
  it("lưới ô số + nhãn theo thứ tự; tối đa 4 ô; hàng thiếu value/label bị bỏ", () => {
    renderWithIntl(
      <RichText
        data={doc(
          stat([
            { value: "+18%", label: "Nguồn cung mới" },
            { value: " ", label: "Thiếu số" },
            { value: "35", label: "" },
            { value: "2.400", label: "Căn mở bán" },
            { value: "5", label: "Dự án" },
            { value: "9", label: "Quận" },
            { value: "10", label: "Thừa" },
          ]),
        )}
      />,
    );
    const list = screen.getByRole("list", { name: "Số liệu nổi bật" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["+18%Nguồn cung mới", "2.400Căn mở bán", "5Dự án", "9Quận"]);
    expect(list.className).toContain("md:grid-cols-4");
  });

  it("/en dùng nhãn tiếng Anh; không còn mục hợp lệ → không render gì", () => {
    const { container } = renderWithIntl(<RichText data={doc(stat([{ value: "+18%", label: "New supply" }]), stat([{ value: "", label: "" }]), stat("x"))} />, "en");
    expect(screen.getAllByRole("list", { name: "Key figures" })).toHaveLength(1);
    expect(container.querySelectorAll("li")).toHaveLength(1);
  });

  it("chữ trong khối được escape, không thành HTML", () => {
    const { container } = renderWithIntl(<RichText data={doc(stat([{ value: "<b>1</b>", label: '<img src=x onerror="alert(1)">' }]))} />);
    expect(container.querySelector("b, img")).toBeNull();
    expect(container.textContent).toContain("<b>1</b>");
  });
});

describe("RichText: khối Ảnh cạnh chữ (BL-054)", () => {
  it("ảnh trái mặc định / phải theo `imagePosition`; < md xếp dọc; giữ xuống dòng; alt của ảnh", () => {
    const { container } = renderWithIntl(<RichText data={doc(imageText({}), imageText({ imagePosition: "right", text: "Dòng 1\nDòng 2" }), imageText({ imagePosition: "bogus" }))} />);
    const rows = [...container.querySelectorAll<HTMLElement>("div.flex-col")].filter((element) => element.querySelector("img"));
    expect(rows).toHaveLength(3);
    expect(rows[0]!.className).toContain("md:flex-row");
    expect(rows[0]!.className).not.toContain("md:flex-row-reverse");
    expect(rows[1]!.className).toContain("md:flex-row-reverse");
    expect(rows[2]!.className).not.toContain("md:flex-row-reverse");
    expect(rows[1]!.querySelector("p")!.textContent).toBe("Dòng 1\nDòng 2");
    expect(rows[1]!.querySelector("p")!.className).toContain("whitespace-pre-line");
    expect(screen.getAllByRole("img", { name: "Ảnh song" })).toHaveLength(3);
  });

  it("ảnh chưa populate / không phải ảnh / thiếu chữ → khối ẩn", () => {
    const { container } = renderWithIntl(
      <RichText
        data={doc(
          imageText({ image: "22222222-2222-4222-8222-222222222222" }),
          imageText({ image: { ...fakeMedia("pdf"), mimeType: "application/pdf" } }),
          imageText({ text: "   " }),
          imageText({ image: null }),
          paragraph("Còn lại"),
        )}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("Còn lại");
  });
});

describe("RichText: khối Dự án nhắc đến (BL-054)", () => {
  it("thẻ một link tới dự án: ảnh, eyebrow, tên, tỉnh · loại · tình trạng, Xem chi tiết", () => {
    renderWithIntl(<RichText data={doc(projectMention())} mentionedProjects={projects(card())} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/du-an/the-crown");
    expect(link).toHaveTextContent("Dự án được nhắc đến");
    expect(link).toHaveTextContent("The Crown Bắc Ninh");
    expect(link).toHaveTextContent("Bắc Ninh · Căn hộ cao cấp · Đang mở bán");
    expect(link).toHaveTextContent("Xem chi tiết");
    expect(link.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("/en: chữ giao diện tiếng Anh, link theo dữ liệu đã dựng theo locale", () => {
    renderWithIntl(<RichText data={doc(projectMention({ id: PROJECT_ID, title: "populate bị bỏ qua" }))} mentionedProjects={projects(card({ href: "/en/projects/the-crown", title: "The Crown", salesStatus: "upcoming", categoryName: null }))} />, "en");
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/en/projects/the-crown");
    expect(link).toHaveTextContent("Featured project");
    expect(link).toHaveTextContent("View details");
    expect(link).not.toHaveTextContent("populate bị bỏ qua");
  });

  it("dự án không có trong map công khai (chưa xuất bản / đã xoá / thiếu EN), id hỏng, không truyền map → khối ẩn", () => {
    for (const data of [doc(projectMention("33333333-3333-4333-8333-333333333333")), doc(projectMention(null)), doc(projectMention({}))]) {
      const { container, unmount } = renderWithIntl(<RichText data={data} mentionedProjects={projects(card())} />);
      expect(container.textContent).toBe("");
      unmount();
    }
    const { container } = renderWithIntl(<RichText data={doc(projectMention())} />);
    expect(container.textContent).toBe("");
  });

  it("khối lạ (blockType ngoài danh sách) vẫn bị bỏ cả khi có map dự án", () => {
    const { container } = renderWithIntl(<RichText data={doc(block({ blockType: "embed", html: "<iframe src=x>", project: PROJECT_ID }), paragraph("Còn"))} mentionedProjects={projects(card())} />);
    expect(container.querySelector("iframe, a")).toBeNull();
    expect(container.textContent).toBe("Còn");
  });
});
