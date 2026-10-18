import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ListPendingProvider, PendingLink, PendingRegion } from "./PendingRegion";

const linkStatus = vi.hoisted(() => ({ pending: false }));

vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: linkStatus.pending }),
}));

function renderList() {
  return render(
    <ListPendingProvider>
      <PendingLink href="/du-an?page=2">Trang 2</PendingLink>
      <PendingRegion>
        <p>Kết quả</p>
      </PendingRegion>
    </ListPendingProvider>,
  );
}

describe("PendingRegion + PendingLink", () => {
  beforeEach(() => {
    linkStatus.pending = false;
  });

  it("không có link chờ → vùng kết quả không busy và không mờ", () => {
    renderList();
    const region = screen.getByText("Kết quả").parentElement;
    expect(region).toHaveAttribute("aria-busy", "false");
    expect(region).not.toHaveClass("opacity-50");
  });

  it("link đang chờ → vùng kết quả aria-busy=true + mờ, link có chỉ báo chờ", () => {
    linkStatus.pending = true;
    renderList();
    const region = screen.getByText("Kết quả").parentElement;
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(region).toHaveClass("opacity-50");
    expect(screen.getByRole("link", { name: "Trang 2" }).querySelector('[data-link-pending="true"]')).not.toBeNull();
  });

  it("forcePending (bộ lọc client) cũng làm vùng busy", () => {
    render(
      <PendingRegion forcePending>
        <p>Kết quả</p>
      </PendingRegion>,
    );
    expect(screen.getByText("Kết quả").parentElement).toHaveAttribute("aria-busy", "true");
  });

  it("PendingLink ngoài provider vẫn render link bình thường", () => {
    render(<PendingLink href="/x">x</PendingLink>);
    expect(screen.getByRole("link", { name: "x" })).toHaveAttribute("href", "/x");
  });
});
