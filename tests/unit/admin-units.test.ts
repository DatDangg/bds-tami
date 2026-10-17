import { describe, expect, it } from "vitest";

import { assertSampleAllowed } from "../../seed";
import { loadAdministrativeUnits } from "../../seed/geo";
import { slugify } from "../../src/lib/slug";

const { provinces, wards } = loadAdministrativeUnits();

describe("seed/data/administrative-units.json (danh mục sau 01/07/2025)", () => {
  it("đủ 34 tỉnh/thành và 3.321 phường/xã/đặc khu (687 / 2.621 / 13)", () => {
    expect(provinces).toHaveLength(34);
    expect(wards).toHaveLength(3321);
    const byType = (type: string) => wards.filter((ward) => ward.type === type).length;
    expect([byType("phuong"), byType("xa"), byType("dac_khu")]).toEqual([687, 2621, 13]);
  });

  it("tên xlsx sai chính tả được sửa theo quyết định user: 40153016 = Phường Đào Duy Từ", () => {
    expect(wards.find((w) => w.code === "40153016")).toMatchObject({ name: "Phường Đào Duy Từ", slug: "phuong-dao-duy-tu" });
  });

  it("mã và slug tỉnh duy nhất; mã phường duy nhất; mọi phường thuộc một tỉnh có thật", () => {
    expect(new Set(provinces.map((p) => p.code)).size).toBe(34);
    expect(new Set(provinces.map((p) => p.slug)).size).toBe(34);
    expect(new Set(wards.map((w) => w.code)).size).toBe(wards.length);
    const provinceCodes = new Set(provinces.map((p) => p.code));
    expect(wards.every((w) => provinceCodes.has(w.provinceCode))).toBe(true);
  });

  it("slug phường duy nhất trong cùng tỉnh (trùng tên giữa các tỉnh được phép)", () => {
    const keys = wards.map((w) => `${w.provinceCode}/${w.slug}`);
    expect(new Set(keys).size).toBe(wards.length);
    expect(wards.every((w) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(w.slug))).toBe(true);
  });

  it("slug sinh bằng slugify của app (chỉ thêm hậu tố -N khi trùng tên trong tỉnh)", () => {
    for (const ward of wards) {
      const base = slugify(ward.name);
      expect(ward.slug === base || ward.slug.startsWith(`${base}-`)).toBe(true);
    }
    expect(provinces.find((p) => p.code === "29")).toMatchObject({
      name: "Thành phố Hồ Chí Minh",
      slug: "ho-chi-minh",
      shortName: "TP.HCM",
    });
  });

  it("mỗi phường có ít nhất một tên cũ, không rỗng, không trùng nhau", () => {
    for (const ward of wards) {
      expect(ward.legacyNames.length).toBeGreaterThanOrEqual(1);
      expect(ward.legacyNames.every((name) => name.trim() !== "")).toBe(true);
      expect(new Set(ward.legacyNames).size).toBe(ward.legacyNames.length);
    }
  });

  it("không có hai phường trong cùng tỉnh dùng chung toàn bộ tên cũ (lỗi gộp theo tên khác dấu)", () => {
    const seen = new Map<string, string>();
    for (const ward of wards) {
      const key = `${ward.provinceCode}|${[...ward.legacyNames].sort().join("|")}`;
      expect(seen.get(key), `${ward.code} ${ward.name} trùng tên cũ với ${seen.get(key)}`).toBeUndefined();
      seen.set(key, `${ward.code} ${ward.name}`);
    }
  });

  it("phường trùng tên không dấu nhưng khác dấu giữ đúng tên cũ của mình", () => {
    const thanhAn = wards.find((w) => w.code === "70143168");
    expect(thanhAn?.name).toBe("Xã Thạnh An");
    expect(thanhAn?.legacyNames.some((name) => name.includes("Dầu Tiếng"))).toBe(false);
    const dauTiengThanhAn = wards.find((w) => w.code === "71113062");
    expect(dauTiengThanhAn?.legacyNames.some((name) => name.includes("Dầu Tiếng"))).toBe(true);
  });

  it("tên cũ dạng phường/xã cũ + quận/huyện cũ (ví dụ ERD)", () => {
    const benThanh = wards.find((w) => w.name === "Phường Bến Thành" && w.provinceCode === "29");
    expect(benThanh?.legacyNames).toContain("Phường Bến Thành, Quận 1");
  });

  it("tên hiển thị chuẩn hoá: tiền tố tỉnh/thành đầy đủ và đúng tiền tố loại đơn vị", () => {
    expect(provinces.every((p) => /^(Tỉnh|Thành phố) /.test(p.name))).toBe(true);
    const prefix = { phuong: "Phường ", xa: "Xã ", dac_khu: "Đặc khu " } as const;
    expect(wards.every((w) => w.name.startsWith(prefix[w.type]))).toBe(true);
    expect(wards.every((w) => w.name === w.name.normalize("NFC"))).toBe(true);
  });
});

describe("assertSampleAllowed (--sample)", () => {
  it("chặn --sample khi APP_ENV=production", () => {
    expect(() => assertSampleAllowed(true, "production")).toThrow(/production/);
  });

  it("cho phép --sample ở dev/staging/test và seed nền ở production", () => {
    expect(() => assertSampleAllowed(true, "development")).not.toThrow();
    expect(() => assertSampleAllowed(true, "staging")).not.toThrow();
    expect(() => assertSampleAllowed(true, undefined)).not.toThrow();
    expect(() => assertSampleAllowed(false, "production")).not.toThrow();
  });
});
