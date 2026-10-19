import { render, screen } from "@testing-library/react";
import type { DefaultCellComponentProps } from "payload";
import { describe, expect, it, vi } from "vitest";

vi.mock("@payloadcms/ui", () => ({
  useListDrawerContext: () => ({}),
  useConfig: () => ({ config: { routes: { admin: "/admin" } } }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import { statusField } from "../../fields/status";
import { translationGroup } from "../../fields/translation";
import { StatusBadge, StatusBadgeCell } from "./StatusBadge";

const cellProps = (props: object) => props as DefaultCellComponentProps;

describe("StatusBadge", () => {
  it("hiện chữ nhãn + chấm và class tone", () => {
    const { container } = render(<StatusBadge value="published" label="Đã xuất bản" />);
    expect(screen.getByText("Đã xuất bản")).toBeInTheDocument();
    expect(container.querySelector(".admin-badge--success")).not.toBeNull();
    expect(container.querySelector(".admin-badge__dot")).not.toBeNull();
  });

  it("Cell lấy nhãn tiếng Việt từ option của field, tone theo giá trị", () => {
    const options = [{ label: "Không thành", value: "lost" }];
    const { container } = render(<StatusBadgeCell {...cellProps({ cellData: "lost", field: { options } })} />);
    expect(screen.getByText("Không thành")).toBeInTheDocument();
    expect(container.querySelector(".admin-badge--danger")).not.toBeNull();
  });

  it("Cell không có giá trị thì hiện gạch ngang, không badge", () => {
    const { container } = render(<StatusBadgeCell {...cellProps({ cellData: undefined, field: { options: [] } })} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(container.querySelector(".admin-badge")).toBeNull();
  });

  it("field trạng thái thật gắn StatusBadgeCell và có nhãn tiếng Việt", () => {
    const fields = [statusField(), ...(translationGroup().fields as { name?: string }[]).filter((f) => f.name === "status")] as {
      admin?: { components?: { Cell?: string } };
      options: { label: unknown; value: string }[];
    }[];
    expect(fields).toHaveLength(2);
    for (const field of fields) {
      expect(field.admin?.components?.Cell).toBe("/components/admin/StatusBadge#StatusBadgeCell");
      for (const option of field.options) expect(typeof option.label).toBe("string");
    }
    expect(fields[0]?.options.find((o) => o.value === "published")?.label).toBe("Đã xuất bản");
  });

  it("cột đầu (link=true): badge nằm trong link sửa bản ghi", () => {
    const { container } = render(
      <StatusBadgeCell {...cellProps({ cellData: "draft", field: { options: [] }, link: true, collectionSlug: "news", rowData: { id: "7" } })} />,
    );
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/admin/collections/news/7");
  });
});
