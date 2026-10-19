import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getRelationships = vi.fn();
const state: { documents: Record<string, Record<string, unknown>> } = { documents: {} };

vi.mock("@payloadcms/ui", () => ({ useListRelationships: () => ({ documents: state.documents, getRelationships }) }));

import { firstMediaRef, pickThumbnailUrl, ThumbnailCell } from "./ThumbnailCell";

beforeEach(() => {
  getRelationships.mockClear();
  state.documents = {};
});

describe("ThumbnailCell", () => {
  it("gallery (mảng id): xin MỘT lần ảnh đầu và hiện size thumb, alt rỗng + lazy", () => {
    state.documents = { media: { m1: { id: "m1", url: "/full.webp", sizes: { thumb: { url: "/thumb.webp" } } } } };
    const { container } = render(<ThumbnailCell cellData={["m1", "m2"]} />);
    expect(getRelationships).toHaveBeenCalledTimes(1);
    expect(getRelationships).toHaveBeenCalledWith([{ relationTo: "media", value: "m1" }]);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/thumb.webp");
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.getAttribute("loading")).toBe("lazy");
  });

  it("cover (một id) hoạt động như gallery", () => {
    state.documents = { media: { c1: { id: "c1", url: "/cover.webp" } } };
    const { container } = render(<ThumbnailCell cellData="c1" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/cover.webp");
  });

  it("không có ảnh: khung trung tính, không img, không gọi API", () => {
    for (const cellData of [undefined, null, []]) {
      const { container } = render(<ThumbnailCell cellData={cellData} />);
      expect(container.querySelector(".admin-thumb")).not.toBeNull();
      expect(container.querySelector("img")).toBeNull();
    }
    expect(getRelationships).not.toHaveBeenCalled();
  });

  it("ảnh chưa tải (null) hoặc không đọc được (false) giữ khung trung tính", () => {
    state.documents = { media: { a: null, b: false } };
    expect(render(<ThumbnailCell cellData="a" />).container.querySelector("img")).toBeNull();
    expect(render(<ThumbnailCell cellData="b" />).container.querySelector("img")).toBeNull();
  });

  it("ảnh lỗi khi tải (onError) rơi về khung trung tính", () => {
    state.documents = { media: { m1: { id: "m1", url: "/x.webp" } } };
    const { container } = render(<ThumbnailCell cellData="m1" />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
  });

  it("helper: ảnh đầu + ưu tiên size thumb", () => {
    expect(firstMediaRef(["a", "b"])).toBe("a");
    expect(firstMediaRef([])).toBeUndefined();
    expect(pickThumbnailUrl({ url: "/u", thumbnailURL: "/t" })).toBe("/t");
    expect(pickThumbnailUrl(false)).toBeUndefined();
  });
});
