import type { CollectionConfig, Field, GlobalConfig } from "payload";

/** Dữ liệu nền chỉ tạo ở màn riêng (Nâng cao · Hệ thống): Tỉnh/thành, Phường/xã, nhân viên (BL-051 A2). */
export const MASTER_DATA_SLUGS: ReadonlySet<string> = new Set(["provinces", "wards", "staff"]);

const isMasterDataRelation = (field: Field): boolean => {
  if (field.type !== "relationship") return false;
  const targets = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo];
  return targets.length > 0 && targets.every((slug) => MASTER_DATA_SLUGS.has(slug));
};

/** Duyệt đệ quy mọi field chứa field con (tabs/row/collapsible/group/array/blocks); chỉ đổi `admin.allowCreate` của ô quan hệ dữ liệu nền. */
export function disableInlineCreateForMasterData(fields: Field[]): Field[] {
  return fields.map((field): Field => {
    if (isMasterDataRelation(field)) return { ...field, admin: { ...field.admin, allowCreate: false } } as Field;
    if (field.type === "tabs") return { ...field, tabs: field.tabs.map((tab) => ({ ...tab, fields: disableInlineCreateForMasterData(tab.fields) })) };
    if (field.type === "blocks") {
      const blocks = field.blocks.map((block) => ({ ...block, fields: disableInlineCreateForMasterData(block.fields) }));
      return { ...field, blocks };
    }
    if ("fields" in field && Array.isArray(field.fields)) return { ...field, fields: disableInlineCreateForMasterData(field.fields) } as Field;
    return field;
  });
}

/** Một chỗ áp cho mọi collection + global (BL-051 A1 ẩn nút API, A2 tắt "+ Thêm mới" inline). Không đổi schema/access/API. */
export function withAdminUxDefaults<T extends CollectionConfig | GlobalConfig>(config: T): T {
  return { ...config, admin: { ...config.admin, hideAPIURL: true }, fields: disableInlineCreateForMasterData(config.fields) };
}
