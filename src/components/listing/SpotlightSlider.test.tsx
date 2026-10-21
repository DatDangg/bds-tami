import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { SpotlightSlider } from "./SpotlightSlider";

const item = (id: string) => ({ id, image: fakeMedia(id, `Ảnh ${id}`), content: <h3>Dự án {id}</h3> });

describe("SpotlightSlider", () => {
  it("vùng carousel có nhãn; mỗi slide có ảnh (alt) + badge + nội dung slot; mũi tên có aria-label; bộ đếm 1 / N ẩn khỏi trình đọc", () => {
    renderWithIntl(<SpotlightSlider label="Dự án nổi bật" badge="Dự án nổi bật" items={[item("a"), item("b"), item("c")]} />);
    const region = screen.getByRole("region", { name: "Dự án nổi bật" });
    expect(region).toHaveAttribute("aria-roledescription", "băng chuyền");
    const slides = within(region).getAllByRole("listitem");
    expect(slides).toHaveLength(3);
    expect(slides[0]).toHaveAccessibleName("1 / 3");
    expect(within(slides[1]!).getByRole("heading", { name: "Dự án b" })).toBeInTheDocument();
    expect(within(slides[0]!).getByRole("img", { name: "Ảnh a" })).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: "Mục nổi bật trước" })).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: "Mục nổi bật sau" })).toBeInTheDocument();
    const counter = within(region).getByText("1 / 3");
    expect(counter).toHaveAttribute("aria-hidden", "true");
  });

  it("mũi tên sau cuộn tới slide kế (không autoplay)", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderWithIntl(<SpotlightSlider label="Nổi bật" badge="Nổi bật" items={[item("a"), item("b")]} />);
    expect(scrollIntoView).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Mục nổi bật sau" }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("1 mục → không mũi tên, không bộ đếm; 0 mục → không render", () => {
    const { unmount } = renderWithIntl(<SpotlightSlider label="Nổi bật" badge="Nổi bật" items={[item("a")]} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("1 / 1")).toBeNull();
    unmount();
    const { container } = renderWithIntl(<SpotlightSlider label="Nổi bật" badge="Nổi bật" items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
