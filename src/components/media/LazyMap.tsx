"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { MapPin } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { approximateLocation, circlePolygon, isValidLocation, type LatLng } from "./map-geometry";
import { ResponsiveImage, type MediaImage } from "./ResponsiveImage";

const APPROXIMATE_RADIUS_M = 300;
// Worker của MapLibre chép vào public/ bởi scripts/copy-maplibre-worker.mjs: URL tự suy ra của thư viện hỏng khi bundler gộp chunk.
const MAPLIBRE_WORKER_URL = "/vendor/maplibre/maplibre-gl-worker.mjs";
// Màu cho layer MapLibre (không đọc được CSS var): --color-accent-text trong skills/react-nodejs/design-tokens.md.
const ACCENT = "#8c6733";
// Chính sách OSM (https://operations.osmfoundation.org/policies/tiles/): bắt buộc attribution, không dùng cho traffic lớn.
const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: { type: "raster" as const, tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19, attribution: OSM_ATTRIBUTION },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

/** Điểm phụ (vd tiện ích quanh dự án) vẽ nhỏ hơn ghim chính; chỉ dùng khi không `approximate`. */
export type MapMarker = { lat: number; lng: number; label: string };

type LazyMapProps = {
  /**
   * Với `approximate`, nơi gọi phía server phải truyền toạ độ đã làm tròn bằng `approximateLocation`
   * (props Client Component bị serialize vào HTML công khai); LazyMap làm tròn lại để phòng thủ.
   */
  location: LatLng;
  /** `showExactAddress = false`: vòng tròn bán kính 300 m quanh toạ độ đã làm tròn thay cho ghim chính xác. */
  approximate?: boolean;
  /** Ảnh tĩnh hiện trước khi bản đồ tải (ảnh `media` của mình); không có thì dùng nền trơn. */
  previewImage?: MediaImage | null;
  /** Điểm phụ ngoài ghim chính; có thì bản đồ tự khung vừa tất cả các điểm (zoom tối đa như bản đồ thường). */
  markers?: readonly MapMarker[];
  /** Nhãn bản đồ cho trình đọc màn hình (vd tên dự án/địa chỉ). */
  label?: string;
  /** Tỉ lệ cố định để CLS = 0; mặc định 4:3 (design-spec §3.8). */
  aspectRatio?: string;
  /** `false`: bỏ link "Mở Google Maps" dưới bản đồ khi nơi gọi đã có nút riêng (vd "Chỉ đường" ở trang Liên hệ, BL-054). */
  showGoogleMapsLink?: boolean;
  className?: string;
};

type Phase = "idle" | "loading" | "ready" | "error";
type Translate = ReturnType<typeof useTranslations>;

type MountOptions = {
  location: LatLng;
  approximate: boolean;
  locale: Record<string, string>;
  markerLabel: string;
  markers: readonly MapMarker[];
};

// `location` đã được làm tròn từ trước nếu tin ẩn địa chỉ.
function googleMapsUrl(location: LatLng, approximate: boolean) {
  const digits = approximate ? 3 : 6;
  return `https://www.google.com/maps?q=${location.lat.toFixed(digits)},${location.lng.toFixed(digits)}`;
}

/** Dựng bản đồ vào `container`, trả hàm dọn. MapLibre và CSS của nó chỉ được import ở đây (khi thật sự cần). */
async function mountMap(container: HTMLElement, { location, approximate, locale, markerLabel, markers }: MountOptions): Promise<() => void> {
  const [maplibre] = await Promise.all([import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl.css")]);
  maplibre.setWorkerUrl(MAPLIBRE_WORKER_URL);
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const map = new maplibre.Map({
    container,
    style: OSM_STYLE,
    center: [location.lng, location.lat],
    zoom: approximate ? 14.5 : 15,
    // Bản đồ không bẫy cuộn: 2 ngón (mobile) / Ctrl + cuộn (desktop).
    cooperativeGestures: true,
    attributionControl: { compact: false },
    fadeDuration: reduceMotion ? 0 : 300,
    locale,
  });
  map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
  if (approximate) {
    map.on("load", () => {
      map.addSource("area", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circlePolygon(location, APPROXIMATE_RADIUS_M)] } },
      });
      map.addLayer({ id: "area-fill", type: "fill", source: "area", paint: { "fill-color": ACCENT, "fill-opacity": 0.2 } });
      map.addLayer({ id: "area-line", type: "line", source: "area", paint: { "line-color": ACCENT, "line-width": 2 } });
    });
  } else {
    const pin = document.createElement("div");
    pin.className = "size-5 rounded-full border-4 border-surface bg-accent-text shadow-md";
    pin.setAttribute("role", "img");
    pin.setAttribute("aria-label", markerLabel);
    new maplibre.Marker({ element: pin }).setLngLat([location.lng, location.lat]).addTo(map);
    for (const point of markers) {
      const dot = document.createElement("div");
      dot.className = "size-3.5 rounded-full border-2 border-surface bg-dark shadow-md";
      dot.setAttribute("role", "img");
      dot.setAttribute("aria-label", point.label);
      new maplibre.Marker({ element: dot }).setLngLat([point.lng, point.lat]).setPopup(new maplibre.Popup({ offset: 10, closeButton: false }).setText(point.label)).addTo(map);
    }
    if (markers.length > 0) {
      const bounds = new maplibre.LngLatBounds([location.lng, location.lat], [location.lng, location.lat]);
      for (const point of markers) bounds.extend([point.lng, point.lat]);
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
    }
  }
  return () => map.remove();
}

export function LazyMap({ location, approximate = false, previewImage, markers = [], label, aspectRatio = "4/3", showGoogleMapsLink = true, className }: LazyMapProps) {
  const t = useTranslations("media.map");
  const [phase, setPhase] = useState<Phase>("idle");
  // Số lần yêu cầu tải (0 = chưa). Effect dựng map chỉ phụ thuộc giá trị này: đổi `phase` không được gỡ map.
  const [loadAttempt, setLoadAttempt] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const valid = isValidLocation(location);
  const shown = valid && approximate ? approximateLocation(location) : location;
  const { lat, lng } = shown;
  // Khoá chuỗi để effect dựng map không chạy lại chỉ vì nơi gọi truyền mảng mới cùng nội dung.
  const markersKey = JSON.stringify(markers);
  const markersRef = useRef(markers);
  useEffect(() => {
    markersRef.current = markers;
  });
  const translateRef = useRef<Translate>(t);
  useEffect(() => {
    translateRef.current = t;
  }, [t]);

  function requestLoad() {
    setPhase("loading");
    setLoadAttempt((attempt) => attempt + 1);
  }

  // Vào viewport (sớm 200px) thì tải; không có IntersectionObserver thì chờ bấm nút.
  useEffect(() => {
    const frame = frameRef.current;
    if (!valid || loadAttempt > 0 || !frame || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) requestLoad();
      },
      { rootMargin: "200px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [valid, loadAttempt]);

  // Map mount một lần cho mỗi lần yêu cầu; chuyển phase loading -> ready KHÔNG nằm trong deps nên không gỡ map.
  // Chỉ gỡ khi unmount, khi đổi toạ độ/chế độ, hoặc khi yêu cầu tải lại.
  useEffect(() => {
    const container = mapRef.current;
    if (loadAttempt === 0 || !container) return;
    const t = translateRef.current;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    mountMap(container, {
      location: { lat, lng },
      approximate,
      markerLabel: t("controls.marker"),
      markers: markersRef.current,
      locale: {
        "NavigationControl.ZoomIn": t("controls.zoomIn"),
        "NavigationControl.ZoomOut": t("controls.zoomOut"),
        "NavigationControl.ResetBearing": t("controls.resetBearing"),
        "AttributionControl.ToggleAttribution": t("controls.toggleAttribution"),
        "Map.Title": t("controls.title"),
        "Marker.Title": t("controls.marker"),
        "CooperativeGesturesHandler.WindowsHelpText": t("gestures.windows"),
        "CooperativeGesturesHandler.MacHelpText": t("gestures.mac"),
        "CooperativeGesturesHandler.MobileHelpText": t("gestures.mobile"),
      },
    }).then(
      (cleanup) => {
        if (cancelled) {
          cleanup();
          return;
        }
        dispose = cleanup;
        setPhase("ready");
      },
      () => {
        if (!cancelled) setPhase("error");
      },
    );
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [loadAttempt, lat, lng, approximate, markersKey]);

  if (!valid) return null;
  const showMap = phase === "loading" || phase === "ready";

  return (
    <div className={className}>
      <div ref={frameRef} role="region" aria-label={label ?? t("region")} className="relative w-full overflow-hidden rounded-sm bg-surface-muted" style={{ aspectRatio }}>
        {showMap ? (
          // Wrapper định vị + container map h-full w-full: maplibre-gl.css (không nằm trong layer, nạp động) đè utility Tailwind v4 `absolute` trên chính container (`.maplibregl-map{position:relative}`) → cao 0px (BL-060).
          <div className="absolute inset-0">
            <div ref={mapRef} className="h-full w-full" />
          </div>
        ) : (
          <>
            {previewImage ? (
              <ResponsiveImage media={previewImage} sizes="(min-width: 1024px) 60vw, 100vw" decorative />
            ) : (
              <MapPin size={48} weight="light" aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-muted" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-dark-deep/20 p-4 text-center">
              {phase === "error" && (
                <p role="alert" className="rounded-sm bg-surface px-3 py-2 text-small text-error">
                  {t("error")}
                </p>
              )}
              <Button
                variant="dark"
                onClick={requestLoad}
              >
                {phase === "error" ? t("retry") : t("viewMap")}
              </Button>
            </div>
          </>
        )}
        {phase === "loading" && (
          <p role="status" className="absolute top-2 left-2 rounded-sm bg-surface px-2 py-1 text-small text-text-secondary">
            {t("loading")}
          </p>
        )}
      </div>
      {approximate && <p className="mt-2 text-small text-text-secondary">{t("approximateNote")}</p>}
      {showGoogleMapsLink && (
        <a
          href={googleMapsUrl(shown, approximate)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center text-small font-semibold text-accent-text underline underline-offset-4"
        >
          {t("openGoogleMaps")}
        </a>
      )}
    </div>
  );
}
