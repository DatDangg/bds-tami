import type { TextField } from "payload";

/**
 * Payload gán cứng nhãn "MIME Type" cho cột của collection upload (không qua i18n). Khai lại field cùng `name` chỉ để đổi nhãn:
 * `mergeBaseFields` gộp sâu field base vào field này (base giữ `hidden`/`readOnly`/`validate`), nên cột DB và kiểu dữ liệu không đổi.
 */
export const mimeTypeLabelField: TextField = { name: "mimeType", type: "text", label: "Loại tệp" };
