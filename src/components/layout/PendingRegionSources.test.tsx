import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { EmptyState } from "./EmptyState";
import { FormPendingMarker, ListPendingProvider, PendingLink, PendingRegion } from "./PendingRegion";

const linkStatus = vi.hoisted(() => ({ pending: false }));
const formStatus = vi.hoisted(() => ({ pending: false }));

vi.mock("next/link", () => ({
  default: ({ children, href, className, "aria-label": label }: { children: ReactNode; href: string; className?: string; "aria-label"?: string }) => (
    <a href={href} className={className} aria-label={label}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: linkStatus.pending }),
}));
vi.mock("react-dom", async (importOriginal) => ({ ...(await importOriginal<typeof import("react-dom")>()), useFormStatus: () => ({ pending: formStatus.pending }) }));

const busy = () => screen.getByText("Kết quả").parentElement;

describe("các nguồn chờ khác của vùng kết quả", () => {
  beforeEach(() => {
    linkStatus.pending = false;
    formStatus.pending = false;
  });

  it("link lọc (tab, Xoá tất cả, gợi ý bỏ điều kiện) đang chờ → vùng kết quả aria-busy", () => {
    linkStatus.pending = true;
    renderWithIntl(
      <ListPendingProvider>
        <PendingLink href="/cho-thue">Xoá tất cả</PendingLink>
        <PendingRegion>
          <p>Kết quả</p>
        </PendingRegion>
      </ListPendingProvider>,
    );
    expect(busy()).toHaveAttribute("aria-busy", "true");
  });

  it("nút Xoá bộ lọc của EmptyState đang chờ → vùng kết quả aria-busy", () => {
    linkStatus.pending = true;
    renderWithIntl(
      <ListPendingProvider>
        <PendingRegion>
          <p>Kết quả</p>
          <EmptyState variant="filtered" clearFiltersHref="/du-an" />
        </PendingRegion>
      </ListPendingProvider>,
    );
    expect(busy()).toHaveAttribute("aria-busy", "true");
  });

  it("gửi form lọc (useFormStatus pending) → vùng kết quả aria-busy; xong thì hết", () => {
    formStatus.pending = true;
    const { rerender } = render(
      <ListPendingProvider>
        <form onSubmit={(event) => event.preventDefault()}>
          <button type="submit">Lọc</button>
          <FormPendingMarker />
        </form>
        <PendingRegion>
          <p>Kết quả</p>
        </PendingRegion>
      </ListPendingProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lọc" }));
    expect(busy()).toHaveAttribute("aria-busy", "true");
    formStatus.pending = false;
    rerender(
      <ListPendingProvider>
        <form>
          <FormPendingMarker />
        </form>
        <PendingRegion>
          <p>Kết quả</p>
        </PendingRegion>
      </ListPendingProvider>,
    );
    expect(busy()).toHaveAttribute("aria-busy", "false");
  });
});
