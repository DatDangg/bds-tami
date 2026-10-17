import { readFileSync } from "node:fs";
import type { Payload } from "payload";

import type { WardType } from "../src/collections/Wards";

export interface ProvinceSeed {
  code: string;
  name: string;
  shortName: string;
  slug: string;
  sortOrder: number;
}

export interface WardSeed {
  provinceCode: string;
  code: string;
  name: string;
  type: WardType;
  slug: string;
  legacyNames: string[];
}

export interface AdministrativeUnits {
  provinces: ProvinceSeed[];
  wards: WardSeed[];
}

export interface UpsertResult {
  created: number;
  updated: number;
  unchanged: number;
}

/** Đọc `seed/data/administrative-units.json` (sinh bởi `scripts/build-admin-units.mjs` từ danh mục chính thức). */
export function loadAdministrativeUnits(): AdministrativeUnits {
  const file = new URL("./data/administrative-units.json", import.meta.url);
  return JSON.parse(readFileSync(file, "utf8")) as AdministrativeUnits;
}

const sameLegacyNames = (current: readonly string[], wanted: readonly string[]) =>
  current.length === wanted.length && current.every((name, i) => name === wanted[i]);

async function findAllByCode<T extends { code: string }>(payload: Payload, collection: "provinces" | "wards") {
  const { docs } = await payload.find({ collection, depth: 0, pagination: false, limit: 0, overrideAccess: true });
  return new Map((docs as unknown as T[]).map((doc) => [doc.code, doc]));
}

type ProvinceDoc = ProvinceSeed & { id: string };

/** Upsert 34 tỉnh/thành theo `code`; chỉ ghi khi có trường khác dữ liệu seed nên chạy lại không đổi gì. */
export async function seedProvinces(payload: Payload, provinces: readonly ProvinceSeed[]): Promise<UpsertResult> {
  const existing = await findAllByCode<ProvinceDoc>(payload, "provinces");
  const result: UpsertResult = { created: 0, updated: 0, unchanged: 0 };
  for (const wanted of provinces) {
    const current = existing.get(wanted.code);
    if (!current) {
      await payload.create({ collection: "provinces", data: wanted, overrideAccess: true });
      result.created += 1;
    } else if (
      current.name !== wanted.name ||
      current.shortName !== wanted.shortName ||
      current.slug !== wanted.slug ||
      current.sortOrder !== wanted.sortOrder
    ) {
      await payload.update({ collection: "provinces", id: current.id, data: wanted, overrideAccess: true });
      result.updated += 1;
    } else result.unchanged += 1;
  }
  return result;
}

type WardDoc = {
  id: string;
  code: string;
  name: string;
  type: WardType;
  slug: string;
  province: string;
  legacyNames?: { name: string }[] | null;
};

/** Upsert phường/xã theo `code` (cần tỉnh đã seed). Gắn tỉnh theo `provinceCode` của dữ liệu seed. */
export async function seedWards(payload: Payload, wards: readonly WardSeed[]): Promise<UpsertResult> {
  const provinces = await findAllByCode<{ id: string; code: string }>(payload, "provinces");
  const existing = await findAllByCode<WardDoc>(payload, "wards");
  const result: UpsertResult = { created: 0, updated: 0, unchanged: 0 };
  for (const { provinceCode, legacyNames, ...fields } of wards) {
    const province = provinces.get(provinceCode);
    if (!province) throw new Error(`Chưa có tỉnh mã ${provinceCode} cho phường ${fields.code}: seed tỉnh trước.`);
    const data = { ...fields, province: province.id, legacyNames: legacyNames.map((name) => ({ name })) };
    const current = existing.get(fields.code);
    if (!current) {
      await payload.create({ collection: "wards", data, overrideAccess: true });
      result.created += 1;
    } else if (
      current.name !== data.name ||
      current.type !== data.type ||
      current.slug !== data.slug ||
      current.province !== data.province ||
      !sameLegacyNames((current.legacyNames ?? []).map((item) => item.name), legacyNames)
    ) {
      await payload.update({ collection: "wards", id: current.id, data, overrideAccess: true });
      result.updated += 1;
    } else result.unchanged += 1;
  }
  return result;
}

/** Seed địa giới 2 cấp (idempotent). Danh mục tĩnh nên chạy được cả staging/production. */
export async function seedGeo(payload: Payload, units: AdministrativeUnits = loadAdministrativeUnits()) {
  const provinces = await seedProvinces(payload, units.provinces);
  const wards = await seedWards(payload, units.wards);
  return { provinces, wards };
}
