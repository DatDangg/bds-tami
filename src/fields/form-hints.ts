// Gắn thành phần gợi ý dưới ô nhập (BL-042 T02) cho field có sẵn — chỉ thêm `admin.components.afterInput`, không đổi dữ liệu/validate.
import type { Field } from "payload";


const SUMMARY_COUNTER = "/components/admin/SummaryCounter#SummaryCounter";
const PRICE_IN_WORDS = "/components/admin/PriceInWords#PriceInWords";
const TODAY_BUTTON = "/components/admin/TodayButton#TodayButton";

function withAfterInput<T extends Field>(field: T, component: string): T {
  const admin = (field as { admin?: { components?: { afterInput?: unknown[] } } }).admin;
  const afterInput = [...(admin?.components?.afterInput ?? []), component];
  return { ...field, admin: { ...admin, components: { ...admin?.components, afterInput } } } as T;
}

/** Bộ đếm ký tự + gợi ý 150–200 cho textarea Mô tả ngắn/Tóm tắt. */
export const withSummaryCounter = <T extends Field>(field: T): T => withAfterInput(field, SUMMARY_COUNTER);
/** Dòng "≈ 3,5 tỷ đồng" dưới ô số tiền VNĐ. */
export const withPriceInWords = <T extends Field>(field: T): T => withAfterInput(field, PRICE_IN_WORDS);
/** Nút "Hôm nay" cạnh ô ngày. */
export const withTodayButton = <T extends Field>(field: T): T => withAfterInput(field, TODAY_BUTTON);

