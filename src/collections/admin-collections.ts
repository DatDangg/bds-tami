import type { CollectionConfig } from "payload";

import { hideTechnicalListFields } from "../lib/admin/list-filter";
import { AuditLogs } from "./AuditLogs";
import { Categories } from "./Categories";
import { ClickEvents } from "./ClickEvents";
import { ClickStatsDaily } from "./ClickStatsDaily";
import { Developers } from "./Developers";
import { JobApplications } from "./JobApplications";
import { JobPostings } from "./JobPostings";
import { LeadActivities } from "./LeadActivities";
import { Leads } from "./Leads";
import { Media } from "./Media";
import { News } from "./News";
import { Pages } from "./Pages";
import { PrivateFiles } from "./PrivateFiles";
import { Projects } from "./Projects";
import { PropertyPosts } from "./PropertyPosts";
import { Provinces } from "./Provinces";
import { Rentals } from "./Rentals";
import { Services } from "./Services";
import { Staff } from "./Staff";
import { TranslationUsage } from "./TranslationUsage";
import { Wards } from "./Wards";

/** Trường nghiệp vụ-phụ ẩn thêm (cột + lọc) ngoài quy tắc chung của helper, theo slug; lý do ở bảng "Danh sách ẩn thêm" của task BL-039 T01. */
const EXTRA_HIDDEN_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  "click-events": ["aggregatedAt"],
  "job-applications": ["consentVersion", "anonymizedAt"],
  leads: ["consentVersion", "anonymizedAt", "mergedCount", "remindedAt", "assigneeInactive"],
};

/**
 * Trường tìm kiếm nghiệp vụ của ô "Tìm theo …" (BL-039). Payload ghép nhãn các trường này vào gợi ý; Lead/Cho thuê đã tự khai báo trong file riêng.
 * Chỉ trường text/email có thật (không relationship); `filename` của Media do Payload tự thêm cho collection upload.
 */
export const LIST_SEARCHABLE_FIELDS: Readonly<Record<string, readonly string[]>> = {
  projects: ["title"],
  news: ["title"],
  "property-posts": ["title"],
  "job-postings": ["title"],
  "job-applications": ["fullName", "email", "phone"],
  pages: ["title"],
  services: ["title"],
  developers: ["name"],
  categories: ["name"],
  media: ["filename", "alt"],
  staff: ["fullName", "email"],
  provinces: ["name"],
  wards: ["name"],
};

/**
 * Mọi collection admin, đã lọc "Hiển thị cột" + "Thêm bộ lọc" còn trường nghiệp vụ (BL-039): một chỗ áp cho tất cả thay vì gọi từng file.
 * Collection có trường ẩn thêm riêng (Rentals, Projects…) đã gọi `hideTechnicalListFields` kèm tham số trong file của nó; lần gọi này chỉ thêm quy tắc chung.
 */
export const ADMIN_COLLECTIONS: CollectionConfig[] = [
  Staff, Media, PrivateFiles, AuditLogs, ClickEvents, ClickStatsDaily, TranslationUsage, Categories, Developers, Provinces, Wards, Services, Pages, News, Projects, Rentals, PropertyPosts, JobPostings, JobApplications, Leads, LeadActivities,
].map((collection) => withListSearchableFields(hideTechnicalListFields(collection, [], EXTRA_HIDDEN_COLUMNS[collection.slug])));

function withListSearchableFields(collection: CollectionConfig): CollectionConfig {
  const fields = LIST_SEARCHABLE_FIELDS[collection.slug];
  if (!fields || collection.admin?.listSearchableFields) return collection;
  return { ...collection, admin: { ...collection.admin, listSearchableFields: [...fields] } };
}
