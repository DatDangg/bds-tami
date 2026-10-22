import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { AmenityView, LocationMediaView, NearbyGroupView } from "@/lib/projects/project-detail-view";
import { ProjectAmenities } from "./ProjectAmenities";
import { ProjectLocation } from "./ProjectLocation";

vi.mock("@/components/media/LazyMap", () => ({ LazyMap: () => <div data-testid="lazy-map" /> }));

const amenity = (id: string, withImage: boolean): AmenityView => ({ id, name: `Tiện ích ${id}`, description: `Mô tả ${id}`, image: withImage ? fakeMedia(id) : null });
const nearby: NearbyGroupView[] = [{ category: "education", items: [{ id: "n1", name: "Trường A", distance: "500 m", location: null }] }];
const place = { lat: 21, lng: 105 };
const video: LocationMediaView = { title: null, image: fakeMedia("poster"), videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" };

describe("ProjectAmenities (BL-058)", () => {
  it("có ít nhất 1 tiện ích có ảnh → slider thẻ (ảnh + tên + mô tả); mục không ảnh vẫn là thẻ; không dùng ảnh chung / nút mở rộng", () => {
    renderWithIntl(<ProjectAmenities amenities={[amenity("a", true), amenity("b", false)]} image={fakeMedia("shared")} />);
    const slider = document.querySelector('[aria-roledescription="carousel"]') as HTMLElement;
    expect(slider).not.toBeNull();
    expect(slider.querySelectorAll('[aria-roledescription="slide"]')).toHaveLength(2);
    expect(within(slider).getByRole("heading", { level: 3, name: "Tiện ích a" })).toBeInTheDocument();
    expect(within(slider).getByText("Mô tả b")).toBeInTheDocument();
    expect(within(slider).getAllByRole("img")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Khám phá tất cả tiện ích" })).toBeNull();
    expect(document.querySelector('img[src*="shared"]')).toBeNull();
  });

  it("không tiện ích nào có ảnh → kiểu cũ: danh sách + ảnh chung + nút Khám phá", () => {
    renderWithIntl(<ProjectAmenities amenities={Array.from({ length: 7 }, (_, index) => amenity(String(index), false))} image={fakeMedia("shared")} />);
    expect(document.querySelector('[aria-roledescription="carousel"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Khám phá tất cả tiện ích" })).toBeInTheDocument();
    expect(document.querySelector('img[src*="shared"]')).not.toBeNull();
  });
});

describe("ProjectLocation + thẻ Kết nối hạ tầng (BL-058)", () => {
  const renderLocation = (media: LocationMediaView | null, hasMap = true) =>
    renderWithIntl(<ProjectLocation projectName="Dự án A" location={hasMap ? place : null} address="Số 1" areaLabel={null} nearby={nearby} locationMedia={media} />);

  it("video → thẻ có tiêu đề mặc định + nút play, KHÔNG iframe trước khi bấm; bấm mới dựng iframe", () => {
    renderLocation(video);
    expect(screen.getByText("Kết nối hạ tầng")).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Kết nối hạ tầng/ }));
    expect(document.querySelector("iframe")).not.toBeNull();
  });

  it("chỉ ảnh → ảnh + tiêu đề tuỳ chỉnh, không nút play; bản EN dùng nhãn mặc định tiếng Anh", () => {
    renderLocation({ title: "Metro số 1", image: fakeMedia("l"), videoUrl: null });
    expect(screen.getByText("Metro số 1")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Ảnh l" })).toBeInTheDocument();
  });

  it("EN: nhãn mặc định 'Infrastructure connections'", () => {
    renderWithIntl(<ProjectLocation projectName="P" location={place} address={null} areaLabel={null} nearby={nearby} locationMedia={video} />, "en");
    expect(screen.getByText("Infrastructure connections")).toBeInTheDocument();
  });

  it("không locationMedia → bản đồ 7 cột + danh sách 5 cột như cũ, không thẻ", () => {
    renderLocation(null);
    expect(screen.queryByText("Kết nối hạ tầng")).toBeNull();
    expect(screen.getByTestId("lazy-map").parentElement).toHaveClass("lg:col-span-7");
    expect(screen.getByTestId("lazy-map").parentElement).not.toHaveClass("xl:col-span-5");
  });

  it("có thẻ + đủ bản đồ + danh sách → xl 5/4/3; thiếu bản đồ → danh sách + thẻ 8/4 (không ô trống)", () => {
    const { unmount } = renderLocation(video);
    expect(screen.getByTestId("lazy-map").parentElement).toHaveClass("xl:col-span-5");
    unmount();
    renderLocation(video, false);
    expect(screen.queryByTestId("lazy-map")).toBeNull();
    expect(screen.getByText("Trường A").closest("div[class*='lg:col-span-8']")).not.toBeNull();
  });
});
