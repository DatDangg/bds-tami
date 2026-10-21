import type { CollectionConfig } from "payload";

const DOCUMENT_NAV_SLOT = "/components/admin/DocumentNavSlot#DocumentNavSlot";

/** Gắn "Quay lại danh sách" + "Xem trên website" vào thanh điều khiển màn sửa của collection (BL-051 A7), giữ slot sẵn có. Global không có danh sách/trang công khai nên không dùng. */
export function withDocumentNavSlot(collection: CollectionConfig): CollectionConfig {
  const edit = collection.admin?.components?.edit;
  const existing = edit?.beforeDocumentControls ?? [];
  const components = { ...collection.admin?.components, edit: { ...edit, beforeDocumentControls: [...existing, DOCUMENT_NAV_SLOT] } };
  return { ...collection, admin: { ...collection.admin, components } };
}
