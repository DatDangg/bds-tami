import type { NumberField } from "payload";

/**
 * Field factory dùng chung của các collection tin / dự án (Dự án, Cho thuê, Tin BĐS — BL-052 P3-T06 gom từ bản sao từng collection).
 * Chỉ dựng cấu hình field, không đổi tên / kiểu cột → không cần migration.
 */

/** Tuỳ chọn `select` từ danh sách giá trị cố định + nhãn admin tiếng Việt, giữ thứ tự danh sách. */
export const selectOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) => values.map((value) => ({ label: labels[value], value }));

/** Ô số không âm (diện tích, số phòng, số tầng…); `index` chỉ khi cột cần lọc / sắp xếp. */
export const nonNegativeNumber = (name: string, label: string, { index = false } = {}): NumberField => ({ name, type: "number", label, min: 0, ...(index ? { index: true } : {}) });
