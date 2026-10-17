import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RichText, safeHref } from "./RichText";

const text = (value: string, format = 0) => ({ type: "text", version: 1, text: value, format });
const paragraph = (...children: unknown[]) => ({ type: "paragraph", version: 1, children });
const doc = (...children: unknown[]) => ({ root: { type: "root", version: 1, children } });
const link = (url: unknown, label: string, extra: Record<string, unknown> = {}) => ({
  type: "link",
  version: 1,
  fields: { linkType: "custom", url, ...extra },
  children: [text(label)],
});

describe("RichText: không render HTML/script tuỳ ý", () => {
  it("chuỗi <script> trong text được escape thành chữ, không thành phần tử", () => {
    const { container } = render(<RichText data={doc(paragraph(text('<script>alert("x")</script><img src=x onerror=alert(1)>')))} />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<script>alert");
  });

  it("node html / block / lạ bị bỏ cả nhánh (kể cả con và trường html)", () => {
    const { container } = render(
      <RichText
        data={doc(
          { type: "html", version: 1, html: "<script>alert(1)</script>", children: [text("ẨN-HTML")] },
          { type: "block", version: 1, fields: { blockType: "embed", html: "<iframe src=x>" } },
          { type: "script", children: [text("ẨN-SCRIPT")] },
          paragraph(text("Còn lại")),
        )}
      />,
    );
    expect(container.querySelector("script, iframe")).toBeNull();
    expect(container.textContent).toBe("Còn lại");
  });

  it("dữ liệu thiếu/sai dạng không ném lỗi và không render gì", () => {
    for (const data of [null, undefined, "x", 5, {}, { root: null }, { root: { children: "x" } }]) {
      const { container, unmount } = render(<RichText data={data} />);
      expect(container.textContent).toBe("");
      unmount();
    }
  });

  it("cây lồng quá sâu bị cắt, không tràn stack", () => {
    let node: unknown = text("sâu");
    for (let i = 0; i < 200; i += 1) node = { type: "quote", children: [node] };
    expect(() => render(<RichText data={doc(node)} />)).not.toThrow();
  });
});

describe("RichText: link", () => {
  it("link ngoài có rel noopener noreferrer; newTab thêm target _blank", () => {
    render(<RichText data={doc(paragraph(link("https://example.com/a", "Ngoài", { newTab: true }), link("https://example.com/b", "Cùng tab")))} />);
    const tab = screen.getByRole("link", { name: "Ngoài" });
    expect(tab).toHaveAttribute("target", "_blank");
    expect(tab.getAttribute("rel")).toContain("noopener");
    const same = screen.getByRole("link", { name: "Cùng tab" });
    expect(same).not.toHaveAttribute("target");
    expect(same.getAttribute("rel")).toContain("noopener");
  });

  it("link nội bộ không có rel; mailto/tel được giữ", () => {
    render(<RichText data={doc(paragraph(link("/tin-tuc/abc", "Nội bộ"), link("mailto:a@b.vn", "Mail"), link("tel:+84900000000", "Gọi")))} />);
    expect(screen.getByRole("link", { name: "Nội bộ" })).not.toHaveAttribute("rel");
    expect(screen.getByRole("link", { name: "Mail" })).toHaveAttribute("href", "mailto:a@b.vn");
    expect(screen.getByRole("link", { name: "Gọi" })).toHaveAttribute("href", "tel:+84900000000");
  });

  it("javascript:/data:/vbscript:/URL không hợp lệ: bỏ link, giữ chữ", () => {
    const bad = ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "data:text/html;base64,AAA", "vbscript:x", "//evil.example/x", "/\\evil.example", "java\nscript:alert(1)", "", null, 5];
    for (const url of bad) {
      const { container, unmount } = render(<RichText data={doc(paragraph(link(url, "Bẫy")))} />);
      expect(container.querySelector("a")).toBeNull();
      expect(container.textContent).toBe("Bẫy");
      unmount();
    }
  });

  it("link nội bộ kiểu `doc` (chưa phân giải được) giữ chữ, không link", () => {
    const internal = { type: "link", fields: { linkType: "internal", doc: { value: "1", relationTo: "news" } }, children: [text("Bài khác")] };
    const { container } = render(<RichText data={doc(paragraph(internal))} />);
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("Bài khác");
  });

  it("safeHref phân loại nội bộ/ngoài", () => {
    expect(safeHref("/a")).toEqual({ href: "/a", external: false });
    expect(safeHref("#muc-1")).toEqual({ href: "#muc-1", external: false });
    expect(safeHref("https://a.vn")).toEqual({ href: "https://a.vn", external: true });
    expect(safeHref("ftp://a.vn")).toBeNull();
  });
});

describe("RichText: cấu trúc", () => {
  it("h1/h2 → h2, h3+ → h3 (trang đã có h1); blockquote, hr, br", () => {
    const { container } = render(
      <RichText
        data={doc(
          { type: "heading", tag: "h1", children: [text("A")] },
          { type: "heading", tag: "h2", children: [text("B")] },
          { type: "heading", tag: "h3", children: [text("C")] },
          { type: "heading", tag: "h5", children: [text("D")] },
          { type: "quote", children: [text("Trích dẫn")] },
          { type: "horizontalrule" },
          paragraph(text("x"), { type: "linebreak" }, text("y")),
        )}
      />,
    );
    expect(container.querySelectorAll("h1")).toHaveLength(0);
    expect([...container.querySelectorAll("h2")].map((node) => node.textContent)).toEqual(["A", "B"]);
    expect([...container.querySelectorAll("h3")].map((node) => node.textContent)).toEqual(["C", "D"]);
    expect(container.querySelector("blockquote")).toHaveTextContent("Trích dẫn");
    expect(container.querySelector("hr")).not.toBeNull();
    expect(container.querySelector("br")).not.toBeNull();
  });

  it("danh sách số/gạch, mục lồng nhau; đoạn rỗng không render", () => {
    const item = (...children: unknown[]) => ({ type: "listitem", children });
    const { container } = render(
      <RichText
        data={doc(
          { type: "list", listType: "number", children: [item(text("1")), item({ type: "list", listType: "bullet", children: [item(text("1.1"))] })] },
          paragraph(text("")),
          paragraph(),
        )}
      />,
    );
    expect(container.querySelector("ol > li")).not.toBeNull();
    expect(container.querySelector("ol ul li")).toHaveTextContent("1.1");
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("định dạng chữ theo bit format", () => {
    const { container } = render(<RichText data={doc(paragraph(text("đậm", 1), text("nghiêng", 2), text("mã", 16), text("cả hai", 3)))} />);
    expect(container.querySelector("strong")).toHaveTextContent("đậm");
    expect(container.querySelector("em")).toHaveTextContent("nghiêng");
    expect(container.querySelector("code")).toHaveTextContent("mã");
    expect(container.querySelector("strong em, em strong")).toHaveTextContent("cả hai");
  });

  it("bảng nằm trong khung cuộn ngang; ô tiêu đề là th", () => {
    const cell = (headerState: number, label: string) => ({ type: "tablecell", headerState, children: [text(label)] });
    const { container } = render(<RichText data={doc({ type: "table", children: [{ type: "tablerow", children: [cell(1, "Cột"), cell(0, "Ô")] }] })} />);
    expect(container.querySelector("div.overflow-x-auto table")).not.toBeNull();
    expect(container.querySelector("th")).toHaveTextContent("Cột");
    expect(container.querySelector("td")).toHaveTextContent("Ô");
  });

  it("ảnh upload: figure + chú thích; chưa populate / không phải ảnh / collection khác thì bỏ", () => {
    const media = {
      id: "m1",
      url: "/api/media/file/a.jpg",
      alt: "Ảnh A",
      caption: "Chú thích A",
      mimeType: "image/jpeg",
      width: 1600,
      height: 900,
      sizes: { large: { url: "/api/media/file/a-1600.webp", width: 1600 } },
    };
    const { container } = render(
      <RichText
        data={doc(
          { type: "upload", relationTo: "media", value: media },
          { type: "upload", relationTo: "media", value: "m2" },
          { type: "upload", relationTo: "media", value: { ...media, mimeType: "application/pdf" } },
          { type: "upload", relationTo: "private-files", value: media },
        )}
      />,
    );
    expect(container.querySelectorAll("figure")).toHaveLength(1);
    expect(container.querySelector("figcaption")).toHaveTextContent("Chú thích A");
    expect(screen.getByRole("img", { name: "Ảnh A" })).toBeInTheDocument();
  });
});
