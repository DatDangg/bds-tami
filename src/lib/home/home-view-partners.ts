import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { Developer } from "../../payload-types";
import { isHttpUrl } from "../content/nav-link";
import { toPublicImage } from "../posts/post-view";
import { renderableImage } from "../projects/project-detail-view";

/** Phần chủ đầu tư mà khối cần (khớp `select` của `loadPartners`). */
export type PartnerDoc = Pick<Developer, "id" | "name" | "logo" | "website">;

export interface PartnerItemView {
  id: string;
  name: string;
  /** `null` khi chưa có logo dùng được: mục chỉ hiện tên. */
  logo: MediaImage | null;
  /** Trang web http(s) hợp lệ → mục là liên kết mở tab mới; không có / không hợp lệ → `null`, mục không là link. */
  website: string | null;
}

/** Khối Đối tác (FR-PUB-17, BL-107). Mục không có tên bị bỏ; rỗng → khối ẩn. */
export interface PartnersBlockView {
  kind: "partners";
  /** Trống → nơi hiển thị dùng chữ mặc định theo ngôn ngữ ("Đối tác" / "Partners"). */
  title: string;
  items: PartnerItemView[];
}

/** Chỉ nhận http(s) (chặn `javascript:`...): giá trị này được render thành `href`. */
function safeWebsite(raw: string | null | undefined): string | null {
  const url = raw?.trim() ?? "";
  return url && isHttpUrl(url) ? url : null;
}

/** `docs` đã theo thứ tự `sortOrder`, tên (xem `loadPartners`): giữ nguyên thứ tự. */
export function toPartnersBlock(title: string, docs: readonly PartnerDoc[]): PartnersBlockView | null {
  const items = docs.flatMap((doc) => {
    const name = doc.name?.trim() ?? "";
    return name ? [{ id: doc.id, name, logo: toPublicImage(renderableImage(doc.logo)), website: safeWebsite(doc.website) }] : [];
  });
  return items.length > 0 ? { kind: "partners", title, items } : null;
}
