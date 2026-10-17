import type { FieldHook } from "payload";

/** `beforeValidate` cho trường text: lưu bản đã cắt khoảng trắng đầu/cuối (khớp bản đã dùng để validate URL/link). */
export const trimText: FieldHook = ({ value }) => (typeof value === "string" ? value.trim() : value);
