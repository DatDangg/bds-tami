import { fireEvent, render, screen } from "@testing-library/react";
import type { DefaultCellComponentProps } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const drawer: { drawerSlug?: string; onSelect?: ReturnType<typeof vi.fn> } = {};
const columns: { accessor: string; active: boolean }[] = [];

vi.mock("@payloadcms/ui", () => ({
  useListDrawerContext: () => drawer,
  useTableColumns: () => ({ columns }),
  useConfig: () => ({ config: { routes: { admin: "/admin" } } }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
  DefaultCell: ({ cellData }: { cellData?: string }) => <span>{cellData}</span>,
}));

import { AssigneeCell } from "./AssigneeCell";
import { LinkedCell } from "./LinkedCell";
import { TitleLinkCell } from "./TitleLinkCell";

const cell = (props: object) => ({ collectionSlug: "rentals", rowData: { id: "9" }, cellData: "Căn A", field: {}, ...props }) as unknown as DefaultCellComponentProps;

beforeEach(() => {
  drawer.drawerSlug = undefined;
  drawer.onSelect = vi.fn();
  columns.length = 0;
});

describe("LinkedCell", () => {
  it("cột link ngoài drawer: một <a> tới trang sửa", () => {
    const { container } = render(<LinkedCell cell={cell({ link: true })}>x</LinkedCell>);
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/admin/collections/rentals/9");
  });

  it("cột link trong drawer: nút gọi onSelect, không có href", () => {
    drawer.drawerSlug = "drawer-1";
    const { container } = render(<LinkedCell cell={cell({ link: true })}>Chọn</LinkedCell>);
    expect(container.querySelector("a")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
    expect(drawer.onSelect).toHaveBeenCalledWith({ collectionSlug: "rentals", doc: { id: "9" }, docID: "9" });
  });

  it("cột không link: không a, không nút", () => {
    const { container } = render(<LinkedCell cell={cell({ link: false })}>x</LinkedCell>);
    expect(container.querySelector("a,button")).toBeNull();
  });
});

describe("TitleLinkCell", () => {
  it("cột đầu là ảnh: tiêu đề mang link (ngoài drawer) hoặc nút chọn (trong drawer)", () => {
    columns.push({ accessor: "gallery", active: true }, { accessor: "title", active: true });
    const { container } = render(<TitleLinkCell {...cell({ link: false })} />);
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/admin/collections/rentals/9");

    drawer.drawerSlug = "d";
    render(<TitleLinkCell {...cell({ link: false })} />);
    fireEvent.click(screen.getByRole("button", { name: "Căn A" }));
    expect(drawer.onSelect).toHaveBeenCalledTimes(1);
  });

  it("tiêu đề không ép link khi cột khác đứng đầu (không trùng link)", () => {
    columns.push({ accessor: "status", active: true }, { accessor: "title", active: true });
    const { container } = render(<TitleLinkCell {...cell({ link: false })} />);
    expect(container.querySelector("a,button")).toBeNull();
  });
});

describe("AssigneeCell", () => {
  it("hiện badge Sale đã nghỉ chỉ khi assigneeInactive === true", () => {
    render(<AssigneeCell {...cell({ rowData: { id: "1", assigneeInactive: true } })} />);
    expect(screen.getByText("Sale đã nghỉ")).toBeInTheDocument();
    const other = render(<AssigneeCell {...cell({ rowData: { id: "2", assigneeInactive: false } })} />);
    expect(other.container.querySelector(".admin-badge")).toBeNull();
    const none = render(<AssigneeCell {...cell({ rowData: { id: "3" } })} />);
    expect(none.container.querySelector(".admin-badge")).toBeNull();
  });
});
