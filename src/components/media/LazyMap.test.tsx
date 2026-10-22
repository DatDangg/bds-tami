import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LazyMap } from "./LazyMap";
import { renderWithIntl } from "./test-utils";

const maplibre = vi.hoisted(() => ({
  moduleLoaded: vi.fn(),
  constructed: vi.fn(),
  remove: vi.fn(),
  addLayer: vi.fn(),
  addSource: vi.fn(),
  addControl: vi.fn(),
  markerAdded: vi.fn(),
  fitBounds: vi.fn(),
  popupText: vi.fn(),
  setWorkerUrl: vi.fn(),
  loadHandlers: [] as Array<() => void>,
}));

vi.mock("maplibre-gl", () => {
  maplibre.moduleLoaded();
  class FakeMap {
    constructor(options: unknown) {
      maplibre.constructed(options);
    }
    addControl = maplibre.addControl;
    addSource = maplibre.addSource;
    addLayer = maplibre.addLayer;
    remove = maplibre.remove;
    fitBounds = maplibre.fitBounds;
    on(_event: string, handler: () => void) {
      maplibre.loadHandlers.push(handler);
    }
  }
  class FakePopup {
    setText(text: string) {
      maplibre.popupText(text);
      return this;
    }
  }
  class FakeBounds {
    extend() {
      return this;
    }
  }
  class FakeMarker {
    setLngLat() {
      return this;
    }
    setPopup() {
      return this;
    }
    addTo() {
      maplibre.markerAdded();
      return this;
    }
  }
  return { Map: FakeMap, Marker: FakeMarker, Popup: FakePopup, LngLatBounds: FakeBounds, NavigationControl: class {}, setWorkerUrl: maplibre.setWorkerUrl };
});
vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));

let observers: FakeIntersectionObserver[] = [];

class FakeIntersectionObserver {
  disconnected = false;
  constructor(readonly callback: IntersectionObserverCallback) {
    observers.push(this);
  }
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
  disconnect() {
    this.disconnected = true;
  }
  intersect() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

function observer() {
  const [first] = observers;
  if (!first) throw new Error("Chưa có IntersectionObserver nào được tạo");
  return first;
}

const location = { lat: 10.7769, lng: 106.7009 };
const exactNumbers = ["10.7769", "106.7009"];

beforeEach(() => {
  observers = [];
  Object.values(maplibre).forEach((entry) => typeof entry === "function" && "mockClear" in entry && entry.mockClear());
  maplibre.loadHandlers.length = 0;
  vi.resetModules();
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});
afterEach(() => vi.unstubAllGlobals());

describe("LazyMap", () => {
  it("chưa vào viewport: chỉ có placeholder + nút 'Xem bản đồ', chưa import maplibre", () => {
    renderWithIntl(<LazyMap location={location} />);
    expect(screen.getByRole("button", { name: "Xem bản đồ" })).toBeInTheDocument();
    expect(observers).toHaveLength(1);
    expect(maplibre.moduleLoaded).not.toHaveBeenCalled();
    expect(maplibre.constructed).not.toHaveBeenCalled();
  });

  it("vào viewport thì import động maplibre, dựng bản đồ OSM không cần API key và có attribution", async () => {
    renderWithIntl(<LazyMap location={location} />);
    await act(async () => observer().intersect());
    await vi.waitFor(() => expect(maplibre.constructed).toHaveBeenCalledTimes(1));
    expect(maplibre.moduleLoaded).toHaveBeenCalledTimes(1);
    expect(maplibre.setWorkerUrl).toHaveBeenCalledWith("/vendor/maplibre/maplibre-gl-worker.mjs");
    const options = maplibre.constructed.mock.lastCall?.[0];
    expect(options.center).toEqual([location.lng, location.lat]);
    expect(options.cooperativeGestures).toBe(true);
    const source = options.style.sources.osm;
    expect(source.tiles).toEqual(["https://tile.openstreetmap.org/{z}/{x}/{y}.png"]);
    expect(source.attribution).toContain("OpenStreetMap");
    expect(JSON.stringify(options.style)).not.toMatch(/key|token/i);
    expect(options.attributionControl).toEqual({ compact: false });
    expect(options.locale["NavigationControl.ZoomIn"]).toBe("Phóng to");
    expect(maplibre.markerAdded).toHaveBeenCalled();
    expect(observer().disconnected).toBe(true);
  });

  it("bấm nút 'Xem bản đồ' tải ngay dù chưa intersect", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LazyMap location={location} />);
    await user.click(screen.getByRole("button", { name: "Xem bản đồ" }));
    await vi.waitFor(() => expect(maplibre.constructed).toHaveBeenCalledTimes(1));
  });

  it("trình duyệt không có IntersectionObserver: vẫn chờ bấm nút", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    renderWithIntl(<LazyMap location={location} />);
    expect(screen.getByRole("button", { name: "Xem bản đồ" })).toBeInTheDocument();
    expect(maplibre.moduleLoaded).not.toHaveBeenCalled();
  });

  it("tin ẩn địa chỉ: vẽ vòng tròn 300 m thay vì ghim, link Google Maps làm tròn toạ độ", async () => {
    renderWithIntl(<LazyMap location={location} approximate />);
    expect(screen.getByText(/bán kính 300 m/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở Google Maps" })).toHaveAttribute("href", "https://www.google.com/maps?q=10.777,106.701");
    await act(async () => observer().intersect());
    await vi.waitFor(() => expect(maplibre.constructed).toHaveBeenCalled());
    expect(maplibre.markerAdded).not.toHaveBeenCalled();
    act(() => maplibre.loadHandlers.forEach((handler) => handler()));
    expect(maplibre.addLayer).toHaveBeenCalledTimes(2);
  });

  it("tin ẩn địa chỉ: không toạ độ chính xác nào lọt vào tâm bản đồ, vòng 300 m hay link", async () => {
    const { container } = renderWithIntl(<LazyMap location={location} approximate />);
    await act(async () => observer().intersect());
    await vi.waitFor(() => expect(maplibre.constructed).toHaveBeenCalled());
    act(() => maplibre.loadHandlers.forEach((handler) => handler()));
    const options = maplibre.constructed.mock.lastCall?.[0];
    expect(options.center).toEqual([106.701, 10.777]);
    const ring: Array<[number, number]> = maplibre.addSource.mock.lastCall?.[1].data.geometry.coordinates[0] ?? [];
    expect(ring.length).toBeGreaterThan(0);
    const href = container.querySelector("a")?.getAttribute("href") ?? "";
    for (const [pointLng, pointLat] of ring) {
      expect(pointLat).not.toBe(location.lat);
      expect(pointLng).not.toBe(location.lng);
    }
    expect(ring[0]).toEqual([106.701, expect.any(Number)]);
    expect(options.center).not.toContain(location.lat);
    expect(options.center).not.toContain(location.lng);
    for (const exact of exactNumbers) {
      expect(JSON.stringify({ center: options.center, zoom: options.zoom, style: options.style })).not.toContain(exact);
      expect(href).not.toContain(exact);
    }
  });

  it("điểm phụ (tiện ích quanh dự án): mỗi điểm một ghim nhỏ + popup tên, bản đồ khung vừa tất cả; không có điểm phụ thì không fitBounds", async () => {
    const { unmount } = renderWithIntl(<LazyMap location={location} markers={[{ lat: 10.78, lng: 106.71, label: "Trường A" }]} />);
    await act(async () => observer().intersect());
    await vi.waitFor(() => expect(maplibre.constructed).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(maplibre.markerAdded).toHaveBeenCalledTimes(2));
    expect(maplibre.popupText).toHaveBeenCalledWith("Trường A");
    expect(maplibre.fitBounds).toHaveBeenCalledWith(expect.anything(), { padding: 48, maxZoom: 15, duration: 0 });
    unmount();
    maplibre.fitBounds.mockClear();
    observers = [];
    renderWithIntl(<LazyMap location={location} />);
    await act(async () => observer().intersect());
    await vi.waitFor(() => expect(maplibre.constructed).toHaveBeenCalledTimes(2));
    expect(maplibre.fitBounds).not.toHaveBeenCalled();
  });

  it("approximate bỏ qua markers: không ghim nào, không fitBounds", async () => {
    renderWithIntl(<LazyMap location={location} approximate markers={[{ lat: 10.78, lng: 106.71, label: "Trường A" }]} />);
    await act(async () => observer().intersect());
    await vi.waitFor(() => expect(maplibre.constructed).toHaveBeenCalled());
    act(() => maplibre.loadHandlers.forEach((handler) => handler()));
    expect(maplibre.markerAdded).not.toHaveBeenCalled();
    expect(maplibre.popupText).not.toHaveBeenCalled();
    expect(maplibre.fitBounds).not.toHaveBeenCalled();
  });

  it("tin hiện địa chỉ: tâm bản đồ là toạ độ thật", async () => {
    renderWithIntl(<LazyMap location={location} />);
    await act(async () => observer().intersect());
    await vi.waitFor(() => expect(maplibre.constructed).toHaveBeenCalled());
    expect(maplibre.constructed.mock.lastCall?.[0].center).toEqual([location.lng, location.lat]);
  });

  it("link Google Maps mở tab mới an toàn", () => {
    renderWithIntl(<LazyMap location={location} />, "en");
    const link = screen.getByRole("link", { name: "Open in Google Maps" });
    expect(link).toHaveAttribute("href", "https://www.google.com/maps?q=10.776900,106.700900");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("button", { name: "View map" })).toBeInTheDocument();
  });

  it("bản đồ đã sẵn sàng thì chưa bị gỡ; chỉ gỡ đúng 1 lần khi unmount", async () => {
    const { unmount } = renderWithIntl(<LazyMap location={location} />);
    await act(async () => observer().intersect());
    await vi.waitFor(() => expect(maplibre.constructed).toHaveBeenCalled());
    // Trạng thái ready (hết "Đang tải bản đồ") đã được áp dụng mà map vẫn còn.
    await vi.waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(maplibre.remove).not.toHaveBeenCalled();
    expect(maplibre.constructed).toHaveBeenCalledTimes(1);
    unmount();
    expect(maplibre.remove).toHaveBeenCalledTimes(1);
  });

  it("không có toạ độ hợp lệ thì ẩn cả khối", () => {
    const { container } = renderWithIntl(<LazyMap location={{ lat: Number.NaN, lng: 200 }} />);
    expect(container).toBeEmptyDOMElement();
    expect(observers).toHaveLength(0);
  });

  it("container truyền cho MapLibre h-full w-full trong wrapper absolute inset-0 (CSS maplibre đè position của chính container → cao 0px, BL-060)", async () => {
    renderWithIntl(<LazyMap location={location} />);
    await act(async () => observer().intersect());
    await vi.waitFor(() => expect(maplibre.constructed).toHaveBeenCalledTimes(1));
    const mapContainer: HTMLElement = maplibre.constructed.mock.lastCall?.[0].container;
    expect(mapContainer).toHaveClass("h-full", "w-full");
    expect(mapContainer).not.toHaveClass("absolute");
    expect(mapContainer.parentElement).toHaveClass("absolute", "inset-0");
  });
});
