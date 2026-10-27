import { render, screen } from "@testing-library/react";
import type { DefaultCellComponentProps } from "payload";
import { describe, expect, it, vi } from "vitest";

vi.mock("@payloadcms/ui", () => ({
  useListDrawerContext: () => ({}),
  useConfig: () => ({ config: { routes: { admin: "/admin" } } }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
  DefaultCell: () => <span>mặc-định</span>,
}));

import { AuthorCell } from "./AuthorCell";

const cell = (props: object) => props as DefaultCellComponentProps;
const base = { collectionSlug: "rentals", link: false };

describe("AuthorCell", () => {
  it("hiện tên từ dữ liệu dòng, không link sang hồ sơ staff, không cell nạp client-side", () => {
    render(<AuthorCell {...cell({ ...base, cellData: "s1", rowData: { id: "r1", authorName: "Sale Hai" } })} />);
    expect(screen.getByText("Sale Hai")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText("mặc-định")).toBeNull();
  });

  it("thiếu authorName nhưng có người tạo → cell mặc định", () => {
    render(<AuthorCell {...cell({ ...base, cellData: "s1", rowData: { id: "r1" } })} />);
    expect(screen.getByText("mặc-định")).toBeInTheDocument();
  });

  it("chưa có người tạo → —", () => {
    render(<AuthorCell {...cell({ ...base, cellData: null, rowData: { id: "r1" } })} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
