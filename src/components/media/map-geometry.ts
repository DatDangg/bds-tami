const EARTH_RADIUS_M = 6_371_000;

export type LatLng = { lat: number; lng: number };

export function isValidLocation(location: Partial<LatLng> | null | undefined): location is LatLng {
  const { lat, lng } = location ?? {};
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

const APPROXIMATE_DIGITS = 3;

/**
 * Làm tròn toạ độ về lưới 0,001 độ (~110 m) cho tin ẩn địa chỉ (`showExactAddress = false`).
 * Vị trí thật cách điểm làm tròn tối đa ~80 m nên vòng 300 m quanh điểm này vẫn chứa vị trí thật.
 *
 * CONTRACT: LazyMap là Client Component, props của nó bị serialize vào HTML/RSC payload công khai.
 * Nơi gọi phía server (Server Component / API) PHẢI gọi hàm này và chỉ truyền toạ độ đã làm tròn khi
 * ẩn địa chỉ; việc làm tròn lại trong LazyMap chỉ là lớp phòng thủ thứ hai, không thay được việc đó.
 */
export function approximateLocation(location: LatLng): LatLng {
  const factor = 10 ** APPROXIMATE_DIGITS;
  return { lat: Math.round(location.lat * factor) / factor, lng: Math.round(location.lng * factor) / factor };
}

/** Vòng tròn bán kính `radiusMeters` quanh tâm, dạng polygon GeoJSON (toạ độ [lng, lat], vòng khép kín) cho tin ẩn địa chỉ chính xác. */
export function circlePolygon(center: LatLng, radiusMeters: number, steps = 64): [number, number][] {
  const angularDistance = radiusMeters / EARTH_RADIUS_M;
  const latRad = (center.lat * Math.PI) / 180;
  const lngRad = (center.lng * Math.PI) / 180;
  const ring: [number, number][] = [];
  for (let step = 0; step <= steps; step += 1) {
    const bearing = (2 * Math.PI * (step % steps)) / steps;
    const pointLat = Math.asin(Math.sin(latRad) * Math.cos(angularDistance) + Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing));
    const pointLng =
      lngRad +
      Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad), Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(pointLat));
    ring.push([(pointLng * 180) / Math.PI, (pointLat * 180) / Math.PI]);
  }
  return ring;
}
