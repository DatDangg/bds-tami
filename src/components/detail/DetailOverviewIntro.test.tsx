import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { DetailOverviewIntro } from "./DetailOverviewIntro";

const paragraph = (value: string) => ({ type: "paragraph", children: [{ type: "text", text: value }] });
const content = (...blocks: unknown[]) => ({ root: { type: "root", children: blocks } });

describe("DetailOverviewIntro (BL-056)", () => {
  it("ưu tiên tóm tắt làm đoạn dẫn; rich text đầy đủ có trong HTML (details) cùng nút Xem thêm / Thu gọn", () => {
    const { container } = renderWithIntl(<DetailOverviewIntro summary="Tóm tắt dự án" content={content(paragraph("Đoạn đầu"), paragraph("Đoạn sau"))} locale="vi" />);
    expect(container.querySelector(":scope > div > p")).toHaveTextContent("Tóm tắt dự án");
    const details = container.querySelector("details")!;
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
    expect(details).toHaveTextContent("Đoạn sau");
    expect(details.querySelector("summary")).toHaveTextContent("Xem thêm");
    expect(details.querySelector("summary")).toHaveTextContent("Thu gọn");
  });

  it("không có tóm tắt → đoạn văn đầu của rich text làm đoạn dẫn", () => {
    const { container } = renderWithIntl(
      <DetailOverviewIntro content={content({ type: "heading", children: [{ type: "text", text: "H" }] }, paragraph("Đoạn đầu"), paragraph("Đoạn hai"))} locale="vi" />,
    );
    expect(container.querySelector(":scope > div > p")).toHaveTextContent("Đoạn đầu");
    expect(container.querySelector("details")).not.toBeNull();
  });

  it("rich text chỉ có đúng đoạn dẫn → không có nút", () => {
    const { container } = renderWithIntl(<DetailOverviewIntro content={content(paragraph("Chỉ một đoạn"))} locale="vi" />);
    expect(container).toHaveTextContent("Chỉ một đoạn");
    expect(container.querySelector("details")).toBeNull();
  });

  it("chỉ có tóm tắt (không rich text) → có đoạn dẫn, không nút", () => {
    const { container } = renderWithIntl(<DetailOverviewIntro summary="Tóm tắt" content={null} locale="vi" />);
    expect(container).toHaveTextContent("Tóm tắt");
    expect(container.querySelector("details")).toBeNull();
  });

  it("BL-056 M-1: đoạn dẫn + ảnh (block không chữ) → vẫn có nút; mở ra không lặp đoạn dẫn", () => {
    const { container } = renderWithIntl(<DetailOverviewIntro content={content(paragraph("Đoạn dẫn"), { type: "upload", value: null })} locale="vi" />);
    const details = container.querySelector("details")!;
    expect(details).not.toBeNull();
    expect(details).not.toHaveTextContent("Đoạn dẫn");
  });

  it("BL-056 M-1: có tóm tắt + rich text chỉ có ảnh → vẫn có nút", () => {
    const { container } = renderWithIntl(<DetailOverviewIntro summary="Tóm tắt" content={content({ type: "upload", value: null })} locale="vi" />);
    expect(container.querySelector("details")).not.toBeNull();
  });

  it("không có gì → không dựng", () => {
    const { container } = renderWithIntl(<DetailOverviewIntro summary=" " content={null} locale="vi" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("EN: nhãn Read more / Show less", () => {
    renderWithIntl(<DetailOverviewIntro summary="Short" content={content(paragraph("A"), paragraph("B"))} locale="en" />, "en");
    expect(screen.getByText("Read more")).toBeInTheDocument();
    expect(screen.getByText("Show less")).toBeInTheDocument();
  });
});
