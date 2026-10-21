import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { DetailContactAside } from "./DetailContactAside";
import { DetailInfoGrid } from "./DetailInfoGrid";
import { DetailSection } from "./DetailSection";
import { DetailSpecBar } from "./DetailSpecBar";
import { DetailStatCards } from "./DetailStatCards";

const icon = <svg data-testid="icon" />;

describe("DetailSpecBar", () => {
  it("bỏ ô trống, tối đa 6 ô, dl > div > dt + dd, nhãn nhóm mặc định", () => {
    const items = [
      { icon, label: "Giá từ", value: "5,4 tỷ" },
      { icon, label: "Quy mô", value: "" },
      { icon, label: "Diện tích", value: "55 – 136 m²" },
      { icon, label: "Chủ đầu tư", value: null },
      ...Array.from({ length: 6 }, (_, i) => ({ icon, label: `Ô ${i}`, value: `v${i}` })),
    ];
    const { container } = renderWithIntl(<DetailSpecBar items={items} />);
    const group = screen.getByRole("group", { name: "Thông số chính" });
    const cells = group.querySelectorAll("dl > div");
    expect(cells).toHaveLength(6);
    for (const cell of cells) expect([...cell.children].map((child) => child.tagName)).toEqual(["DT", "DD"]);
    expect(screen.queryByText("Quy mô")).toBeNull();
    expect(screen.queryByText("Chủ đầu tư")).toBeNull();
    expect(within(group).getByText("5,4 tỷ").tagName).toBe("DD");
    expect(container.querySelector("dt [aria-hidden='true']")).not.toBeNull();
  });

  it("mọi ô trống → không dựng", () => {
    const { container } = renderWithIntl(<DetailSpecBar items={[{ icon, label: "Giá", value: " " }]} label="X" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("DetailInfoGrid", () => {
  it("bỏ ô trống; rỗng → không dựng", () => {
    renderWithIntl(
      <DetailInfoGrid
        items={[
          { icon, label: "Tên thương mại", value: "The Crown" },
          { icon, label: "Pháp lý", value: null },
        ]}
      />,
    );
    expect(screen.getByText("Tên thương mại").tagName).toBe("DT");
    expect(screen.getByText("The Crown").tagName).toBe("DD");
    expect(screen.queryByText("Pháp lý")).toBeNull();
    const { container } = renderWithIntl(<DetailInfoGrid items={[{ icon, label: "A", value: "" }]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("link: external → mở tab mới; internal → link nội bộ mở tại chỗ", () => {
    renderWithIntl(
      <DetailInfoGrid
        items={[
          { icon, label: "Chủ đầu tư", value: "TAMI", link: { kind: "external", href: "https://tami.example", newTabLabel: "(mở tab mới)" } },
          { icon, label: "Thuộc dự án", value: "Sông Sài Gòn", link: { kind: "internal", href: "/du-an/song-sai-gon" } },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /^TAMI\s?\(mở tab mới\)$/ })).toHaveAttribute("target", "_blank");
    const internal = screen.getByRole("link", { name: "Sông Sài Gòn" });
    expect(internal).toHaveAttribute("href", "/du-an/song-sai-gon");
    expect(internal).not.toHaveAttribute("target");
  });

  it("ô ngày (dateTime): giá trị bọc <time dateTime> (ngày đăng tin cho thuê)", () => {
    renderWithIntl(<DetailInfoGrid items={[{ icon, label: "Ngày đăng", value: "15/11/2026", dateTime: "2026-11-15T00:00:00.000Z" }]} />);
    const time = screen.getByText("15/11/2026");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-11-15T00:00:00.000Z");
  });
});

describe("DetailStatCards", () => {
  it("thẻ số lớn + nhãn + dòng phụ; rỗng → không dựng", () => {
    renderWithIntl(
      <DetailStatCards
        label="Sản phẩm"
        items={[
          { value: "96", label: "Biệt thự đơn lập", note: "200 – 360 m²" },
          { value: null, label: "Shophouse" },
        ]}
      />,
    );
    const cards = within(screen.getByRole("list", { name: "Sản phẩm" })).getAllByRole("listitem");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("96Biệt thự đơn lập200 – 360 m²");
    expect(cards[1]).toHaveTextContent("Shophouse");
    const { container } = renderWithIntl(<DetailStatCards items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("DetailSection (mô tả BL-052)", () => {
  it("eyebrow + h2 + mô tả; không mô tả → không có đoạn mô tả", () => {
    renderWithIntl(
      <DetailSection id="overview" eyebrow="Giới thiệu" title="Tổng quan dự án" description="Khu đô thị">
        <p>Nội dung</p>
      </DetailSection>,
    );
    const section = screen.getByRole("region", { name: "Tổng quan dự án" });
    expect(section).toHaveAttribute("id", "overview");
    expect(section.className).toContain("scroll-mt-");
    expect(within(section).getByText("Khu đô thị")).toBeInTheDocument();
    renderWithIntl(
      <DetailSection id="x" title="Khác">
        <p>Nội dung 2</p>
      </DetailSection>,
    );
    expect(screen.getByRole("region", { name: "Khác" }).querySelectorAll("p")).toHaveLength(1);
  });
});

describe("DetailContactAside", () => {
  it("thẻ form #lead-form có tiêu đề + mô tả; hotline nền tối link tel: Gọi ngay", () => {
    renderWithIntl(
      <DetailContactAside title="Nhận thông tin dự án" headingId="consult" description="Đăng ký để nhận bảng giá" hotline={{ label: "1900 0000", telHref: "tel:19000000" }}>
        <form aria-label="lead" />
      </DetailContactAside>,
    );
    const card = screen.getByRole("region", { name: "Nhận thông tin dự án" });
    expect(card).toHaveAttribute("id", "lead-form");
    expect(within(card).getByText("Đăng ký để nhận bảng giá")).toBeInTheDocument();
    expect(within(card).getByRole("form", { name: "lead" })).toBeInTheDocument();
    const call = screen.getByRole("link", { name: "Gọi ngay 1900 0000" });
    expect(call).toHaveAttribute("href", "tel:19000000");
    expect(card.parentElement?.className).toContain("lg:sticky");
  });

  it("không hotline → ẩn khối Gọi ngay", () => {
    renderWithIntl(
      <DetailContactAside title="Nhận tư vấn" headingId="c2">
        <p>form</p>
      </DetailContactAside>,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText("Hotline tư vấn")).toBeNull();
  });

  it("header: một thẻ trắng bọc phần đầu + vùng form (#lead-form nền trong suốt), phần đầu nằm trên tiêu đề form", () => {
    renderWithIntl(
      <DetailContactAside title="Nhận tư vấn" headingId="c3" header={<p>12 triệu/tháng</p>}>
        <form aria-label="lead" />
      </DetailContactAside>,
    );
    const slot = screen.getByRole("region", { name: "Nhận tư vấn" });
    expect(slot).toHaveAttribute("id", "lead-form");
    expect(slot.className).toContain("bg-transparent");
    const card = slot.parentElement as HTMLElement;
    expect(card.className).toContain("bg-surface");
    expect(card.parentElement?.className).toContain("lg:sticky");
    const header = screen.getByText("12 triệu/tháng");
    expect(card).toContainElement(header);
    expect(header.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
