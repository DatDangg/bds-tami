import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TocHeading } from "@/lib/content/section-headings";
import * as tocModule from "./NewsToc";
import { NewsTocDisclosure } from "./NewsToc";

const headings: TocHeading[] = [
  { id: "mot", text: "Phần một", level: 2 },
  { id: "con", text: "Mục con", level: 3 },
  { id: "hai", text: "Phần hai", level: 2 },
];

function renderWithTargets(ui: ReactElement) {
  return render(
    <>
      {ui}
      {headings.map((heading) => (
        <h2 key={heading.id} id={heading.id} tabIndex={-1}>
          {heading.text}
        </h2>
      ))}
    </>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("NewsTocDisclosure (BL-045, Q3: khối thu gọn đầu bài ở mọi breakpoint)", () => {
  it("<details> đóng mặc định, có summary, nav có nhãn, link #id thật, heading cấp 3 thụt vào; KHÔNG ẩn ở lg", () => {
    const { container } = renderWithTargets(<NewsTocDisclosure headings={headings} label="Mục lục" />);
    const details = container.querySelector("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details.className).not.toContain("lg:hidden");
    expect(details.querySelector("summary")?.textContent).toBe("Mục lục");
    expect(screen.getByRole("navigation", { name: "Mục lục" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Phần một" })).toHaveAttribute("href", "#mot");
    expect(screen.getByRole("link", { name: "Mục con" }).className).toContain("pl-6");
    expect(screen.getByRole("link", { name: "Phần một" }).className).toContain("pl-3");
  });

  it("không còn mục lục dính cột trái (NewsTocSidebar)", () => {
    expect("NewsTocSidebar" in tocModule).toBe(false);
  });

  it("bấm mục: gập lại, cuộn mượt tới heading, focus heading, đặt hash", () => {
    const { container } = renderWithTargets(<NewsTocDisclosure headings={headings} label="Mục lục" />);
    const target = document.getElementById("hai") as HTMLElement;
    target.scrollIntoView = vi.fn();
    const details = container.querySelector("details") as HTMLDetailsElement;
    details.open = true;
    fireEvent.click(screen.getByRole("link", { name: "Phần hai" }));
    expect(details.open).toBe(false);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(document.activeElement).toBe(target);
    expect(window.location.hash).toBe("#hai");
  });

  it("giảm chuyển động: cuộn tức thì (behavior auto)", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    renderWithTargets(<NewsTocDisclosure headings={headings} label="Mục lục" />);
    const target = document.getElementById("mot") as HTMLElement;
    target.scrollIntoView = vi.fn();
    fireEvent.click(screen.getByRole("link", { name: "Phần một" }));
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });
});
