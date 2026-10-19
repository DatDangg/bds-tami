import { render, screen } from "@testing-library/react";
import type { DefaultCellComponentProps } from "payload";
import { describe, expect, it, vi } from "vitest";

vi.mock("@payloadcms/ui", () => ({
  useListDrawerContext: () => ({}),
  useConfig: () => ({ config: { routes: { admin: "/admin" } } }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
  DefaultCell: () => <span>mặc-định</span>,
}));

import { AssigneeCell } from "./AssigneeCell";

const cell = (props: object) => props as DefaultCellComponentProps;
const base = { collectionSlug: "leads", link: true };

describe("AssigneeCell", () => {
  it("hiện tên từ dữ liệu dòng, là link sửa lead, không cell nạp client-side", () => {
    render(<AssigneeCell {...cell({ ...base, cellData: "s1", rowData: { id: "l1", assigneeName: "Nguyễn Văn A" } })} />);
    expect(screen.getByRole("link", { name: "Nguyễn Văn A" })).toHaveAttribute("href", "/admin/collections/leads/l1");
    expect(screen.queryByText("mặc-định")).toBeNull();
  });

  it("chưa giao → —", () => {
    render(<AssigneeCell {...cell({ ...base, cellData: null, rowData: { id: "l1", assigneeName: null } })} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("thiếu assigneeName nhưng có người phụ trách → cell mặc định", () => {
    render(<AssigneeCell {...cell({ ...base, cellData: "s1", rowData: { id: "l1" } })} />);
    expect(screen.getByText("mặc-định")).toBeInTheDocument();
  });

  it("sale bị khoá → badge Sale đã nghỉ", () => {
    render(<AssigneeCell {...cell({ ...base, cellData: "s1", rowData: { id: "l1", assigneeName: "B", assigneeInactive: true } })} />);
    expect(screen.getByText("Sale đã nghỉ")).toBeInTheDocument();
  });
});
