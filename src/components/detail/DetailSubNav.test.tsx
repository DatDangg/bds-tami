import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DetailSubNav } from "./DetailSubNav";

const items = [
  { id: "overview", label: "Tổng quan" },
  { id: "legal", label: "Pháp lý" },
  { id: "gallery", label: "Thư viện" },
];

let observers: FakeIntersectionObserver[] = [];

class FakeIntersectionObserver {
  constructor(readonly callback: IntersectionObserverCallback) {
    observers.push(this);
  }
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
  disconnect() {}
}

/** Báo cho observer rằng mục `id` vào/ra dải quan sát. */
function report(id: string, isIntersecting: boolean) {
  const [observer] = observers;
  if (!observer) throw new Error("Chưa có IntersectionObserver nào được tạo");
  const target = document.getElementById(id);
  act(() => observer.callback([{ isIntersecting, target } as unknown as IntersectionObserverEntry], observer as unknown as IntersectionObserver));
}

/** Đặt `bottom` của mục cuối (tính từ đỉnh viewport) để mô phỏng đã cuộn qua / còn phía dưới. */
function setLastSectionBottom(bottom: number) {
  const last = document.getElementById("gallery");
  if (!last) throw new Error("Thiếu mục cuối");
  last.getBoundingClientRect = () => ({ bottom }) as DOMRect;
}

function activeLabels() {
  return screen.queryAllByRole("link").filter((link) => link.getAttribute("aria-current") === "location").map((link) => link.textContent);
}

beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  for (const { id } of items) {
    const section = document.createElement("section");
    section.id = id;
    section.tabIndex = -1;
    section.scrollIntoView = vi.fn();
    document.body.appendChild(section);
  }
  render(<DetailSubNav items={items} label="Mục con" />);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("DetailSubNav — mục đang xem", () => {
  it("ban đầu mục đầu là mục đang xem", () => {
    expect(activeLabels()).toEqual(["Tổng quan"]);
  });

  it("mục thứ hai vào dải quan sát thì mục đó active", () => {
    report("legal", true);
    expect(activeLabels()).toEqual(["Pháp lý"]);
  });

  it("cuộn qua hết mục cuối (mọi mục rời dải, mục cuối nằm phía trên dải) thì không mục nào active", () => {
    report("gallery", true);
    expect(activeLabels()).toEqual(["Thư viện"]);
    setLastSectionBottom(40);
    report("gallery", false);
    expect(activeLabels()).toEqual([]);
    for (const link of screen.getAllByRole("link")) expect(link.className).not.toContain("bg-primary");
  });

  it("cuộn ngược vào mục cuối thì active lại", () => {
    report("gallery", true);
    setLastSectionBottom(40);
    report("gallery", false);
    report("gallery", true);
    expect(activeLabels()).toEqual(["Thư viện"]);
  });

  it("tập rỗng nhưng mục cuối còn bên dưới dải (ở trên mục đầu / khe giữa mục) thì giữ active hiện tại", () => {
    setLastSectionBottom(1500);
    report("overview", true);
    report("overview", false);
    expect(activeLabels()).toEqual(["Tổng quan"]);
  });

  it("vừa bấm link (scrollLocked) thì callback rỗng + qua cuối không xoá active", () => {
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("link", { name: "Pháp lý" }));
    setLastSectionBottom(40);
    report("overview", false);
    expect(activeLabels()).toEqual(["Pháp lý"]);
  });
});
