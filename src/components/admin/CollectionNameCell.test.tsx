import { render, screen } from "@testing-library/react";
import type { DefaultCellComponentProps } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const field = vi.hoisted(() => ({ value: undefined as unknown }));
const useField = vi.hoisted(() => vi.fn());

vi.mock("@payloadcms/ui", () => ({
  useListDrawerContext: () => ({}),
  useConfig: () => ({ config: { routes: { admin: "/admin" } } }),
  useField: (args: unknown) => useField(args),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import { CollectionNameCell } from "./CollectionNameCell";
import { CollectionNameHint } from "./CollectionNameHint";

const cell = (cellData: unknown) => ({ cellData }) as unknown as DefaultCellComponentProps;

describe("CollectionNameCell", () => {
  it("slug biết → tên tiếng Việt", () => {
    render(<CollectionNameCell {...cell("rentals")} />);
    expect(screen.getByText("Tin cho thuê")).toBeInTheDocument();
  });

  it("slug lạ giữ nguyên", () => {
    render(<CollectionNameCell {...cell("old-collection")} />);
    expect(screen.getByText("old-collection")).toBeInTheDocument();
  });

  it.each([null, undefined, ""])("rỗng (%s) hiện —", (value) => {
    render(<CollectionNameCell {...cell(value)} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("CollectionNameHint", () => {
  beforeEach(() => {
    useField.mockReset();
    useField.mockImplementation(() => ({ value: field.value }));
  });

  it("hiện tên tiếng Việt dưới ô", () => {
    field.value = "leads";
    render(<CollectionNameHint path="collection" />);
    expect(screen.getByText("Tên gọi: Lead")).toBeInTheDocument();
    expect(useField).toHaveBeenCalledWith({ path: "collection" });
  });

  it("slug global cũng có tên gọi", () => {
    field.value = "site-settings";
    render(<CollectionNameHint path="collection" />);
    expect(screen.getByText("Tên gọi: Cấu hình chung")).toBeInTheDocument();
  });

  it("slug lạ → không hiện (tên = mã gốc)", () => {
    field.value = "old-collection";
    const { container } = render(<CollectionNameHint path="collection" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("không có giá trị → không render", () => {
    field.value = "";
    const { container } = render(<CollectionNameHint path="collection" />);
    expect(container).toBeEmptyDOMElement();
  });
});
