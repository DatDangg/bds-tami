import type { DateField } from "payload";

type DatePickerConfig = NonNullable<NonNullable<DateField["admin"]>["date"]>;
export type DatePickerAppearance = NonNullable<DatePickerConfig["pickerAppearance"]>;

/** Ngày giờ dạng Việt Nam; dùng chung cho `admin.dateFormat` (ô danh sách) và ô nhập ngày-giờ. */
export const VN_DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm";

/**
 * Payload 3.91 DatePicker bỏ qua `admin.dateFormat` toàn cục: ô nhập lấy `date.displayFormat`, thiếu thì hard-code kiểu Mỹ theo
 * `pickerAppearance` ("Oct 19, 2026 10:26 AM") và danh sách giờ dùng AM/PM. Mọi field `type: "date"` phải đi qua helper này.
 */
const VN_DISPLAY_FORMAT: Record<DatePickerAppearance, string> = {
  dayAndTime: VN_DATE_TIME_FORMAT,
  dayOnly: "dd/MM/yyyy",
  default: "dd/MM/yyyy",
  timeOnly: "HH:mm",
  monthOnly: "MM/yyyy",
};

const SHOWS_TIME_LIST: ReadonlySet<DatePickerAppearance> = new Set(["dayAndTime", "timeOnly"]);

/** Giữ nguyên `pickerAppearance` của field, chỉ thêm định dạng hiển thị Việt (24 giờ khi có giờ). */
export function adminDate(pickerAppearance: DatePickerAppearance = "default"): DatePickerConfig {
  return {
    pickerAppearance,
    displayFormat: VN_DISPLAY_FORMAT[pickerAppearance],
    ...(SHOWS_TIME_LIST.has(pickerAppearance) ? { timeFormat: "HH:mm" } : {}),
  };
}
