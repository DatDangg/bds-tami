import { render, screen } from "@testing-library/react";
import type { DefaultCellComponentProps } from "payload";
import { describe, expect, it, vi } from "vitest";

vi.mock("@payloadcms/ui", () => ({
  useListDrawerContext: () => ({}),
  useConfig: () => ({ config: { routes: { admin: "/admin" } } }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import { VndCell } from "./VndCell";

const cell = (cellData: unknown) => ({ cellData }) as unknown as DefaultCellComponentProps;

describe("VndCell", () => {
  it("định dạng VNĐ có dấu chấm nghìn", () => {
    render(<VndCell {...cell(110000000)} />);
    expect(screen.getByText(/^110\.000\.000\s₫$/)).toBeInTheDocument();
  });

  it("giá 0 vẫn là số", () => {
    render(<VndCell {...cell(0)} />);
    expect(screen.getByText(/^0\s₫$/)).toBeInTheDocument();
  });

  it.each([null, undefined, "", "abc"])("trống (%s) hiện —", (value) => {
    render(<VndCell {...cell(value)} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
