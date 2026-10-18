"use client";

import type { RentalFilterOptions, WardOption } from "@/lib/rentals/rental-list-queries";
import { useApiJson } from "./use-api-json";

interface WardsResponse {
  docs: Array<{ name: string; slug: string }>;
}

/** Payload REST `GET /api/wards`: danh mục tĩnh công khai (`access.read` mở), chỉ lấy tên + slug của một tỉnh. */
const wardsApiPath = (provinceId: string): string =>
  `/api/wards?where[province][equals]=${encodeURIComponent(provinceId)}&sort=name&limit=500&depth=0&select[name]=true&select[slug]=true`;

/**
 * Phường/xã cho ô lọc theo tỉnh ĐANG CHỌN trong bộ lọc (chưa chắc đã lên URL). Tỉnh trùng tỉnh server đã dựng sẵn thì dùng luôn danh sách đó
 * (không gọi mạng); đổi sang tỉnh khác (chỉ xảy ra trong Sheet, vì thanh desktop đổi URL ngay và server trả danh sách mới) thì tải qua REST.
 */
export function useWardOptions(provinceSlug: string, options: RentalFilterOptions): { wards: WardOption[]; loading: boolean } {
  const province = options.provinces.find((item) => item.slug === provinceSlug);
  const needsFetch = province !== undefined && provinceSlug !== options.wardsProvince;
  const { data, loading } = useApiJson<WardsResponse>(needsFetch ? wardsApiPath(province.id) : null);
  if (!province) return { wards: [], loading: false };
  if (!needsFetch) return { wards: options.wards, loading: false };
  return { wards: data?.docs.map((ward) => ({ slug: ward.slug, name: ward.name })) ?? [], loading };
}
