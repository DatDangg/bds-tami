"use client";

import { FieldDescription, FieldError, FieldLabel, RenderCustomComponent, useField } from "@payloadcms/ui";
import { mergeFieldStyles } from "@payloadcms/ui/shared";
import type { PointFieldClientProps, Validate } from "payload";
import { useCallback, useMemo, useState } from "react";

import { parseMapLocationInput } from "@/lib/admin/map-location-parse";

/** Giá trị Payload của ô point: `[kinh độ, vĩ độ]`; phần chưa nhập là chuỗi rỗng (như ô point mặc định) để validate server báo thiếu. */
type PointValue = [number | string, number | string];

function numberOrNull(part: unknown): number | null {
  return typeof part === "number" && Number.isFinite(part) ? part : null;
}

/** Truyền SỐ (không chuỗi đã chuẩn hoá) như ô point mặc định của Payload: React chỉ giữ chữ đang gõ ("106.70") khi so lỏng bằng số; chuỗi "106.7" sẽ ghi đè và nuốt số 0. */
const toInputValue = (part: unknown) => numberOrNull(part) ?? "";

/** Link mở đúng điểm trên Google Maps; chỉ khi đủ hai số. */
export function googleMapsUrl(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const lng = numberOrNull(value[0]);
  const lat = numberOrNull(value[1]);
  return lng === null || lat === null ? null : `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Sửa 1 trong 2 ô số rồi ghép lại `[lng, lat]`; cả hai trống → null (xoá toạ độ). */
export function nextPointValue(current: unknown, index: 0 | 1, text: string): PointValue | null {
  const next: PointValue = Array.isArray(current) ? [current[0] ?? "", current[1] ?? ""] : ["", ""];
  const parsed = Number.parseFloat(text);
  next[index] = Number.isNaN(parsed) ? text : parsed;
  return next.every((part) => part === "") ? null : next;
}

const PASTE_MESSAGES = {
  "short-link": "Link rút gọn không đọc được toạ độ. Hãy mở link trong Google Maps rồi dán cặp số (vĩ độ, kinh độ) thay vì link rút gọn.",
  reversed: "Có vẻ bạn dán ngược vĩ độ và kinh độ. Google Maps ghi vĩ độ trước, kinh độ sau (ví dụ 10.7769, 106.7009).",
  unreadable: "Không đọc được toạ độ. Dán cặp số dạng 10.7769, 106.7009 hoặc link Google Maps có toạ độ.",
} as const;

/**
 * Ô "Toạ độ bản đồ" dùng chung (BL-131): ô dán cặp số / link Google Maps tự điền, hai ô số **Vĩ độ trước, Kinh độ sau**
 * (khớp thứ tự Google Maps) nhưng dữ liệu vẫn lưu `[lng, lat]` như ô point mặc định của Payload. Validate server (vùng Việt Nam) giữ nguyên.
 */
export function MapLocationField({ field, path: pathFromProps, readOnly, validate }: PointFieldClientProps) {
  const { admin: { className, description, step } = {}, label, localized, required } = field;
  // Không có validate phía client (validate tuỳ biến chỉ chạy server) → trả `undefined` như ô point mặc định của Payload: useField giữ nguyên
  // lỗi server trả về sau khi Lưu. Trả `true` sẽ ghi đè thành hợp lệ → lỗi "nhập ngược" / "ngoài Việt Nam" không hiện dưới ô.
  const memoizedValidate = useCallback(
    (value: PointValue | null, validationOptions: Parameters<NonNullable<PointFieldClientProps["validate"]>>[1]) =>
      typeof validate === "function" ? validate(value as Parameters<typeof validate>[0], { ...validationOptions, required } as Parameters<typeof validate>[1]) : undefined,
    [validate, required],
  );
  // Payload tự ép kiểu validate ở đây (PointFieldValidation và Validate lệch tham số options, không có kiểu chung đúng).
  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    path,
    setValue,
    showError,
    value,
  } = useField<PointValue | null>({ potentiallyStalePath: pathFromProps, validate: memoizedValidate as unknown as Validate });
  const [pasteText, setPasteText] = useState("");
  const [pasteProblem, setPasteProblem] = useState<keyof typeof PASTE_MESSAGES | null>(null);
  // Như ô point mặc định: không có admin.width → flex 1 1 auto, nếu không hàng Row co ô về bề rộng nội dung (BL-130).
  const fieldStyle = useMemo(() => mergeFieldStyles(field), [field]);
  const stepAttr = typeof step === "number" ? step : "any";
  const locked = Boolean(readOnly || disabled);
  const idSuffix = path?.replace(/\./g, "__");

  // Chỉ áp dụng khi người dùng dán (onPaste) hoặc gõ xong rồi Enter/rời ô: áp dụng mỗi phím gõ sẽ điền số dở ("10.7769, 1" → kinh độ 1).
  const applyPasteText = (text: string) => {
    const result = text.trim() ? parseMapLocationInput(text) : undefined;
    if (result === undefined) return setPasteProblem(null);
    if (result === null) return setPasteProblem("unreadable");
    if ("error" in result) return setPasteProblem(result.error);
    setValue([result.lng, result.lat] satisfies PointValue);
    setPasteText("");
    setPasteProblem(null);
  };
  const mapsUrl = googleMapsUrl(value);
  const rootClass = ["field-type", "tami-map-location", className, showError && "error", locked && "read-only"].filter(Boolean).join(" ");

  return (
    <div className={rootClass} style={fieldStyle}>
      <RenderCustomComponent CustomComponent={Label} Fallback={<FieldLabel label={label} localized={localized} path={path} required={required} />} />
      {!locked && (
        <div className="tami-map-location__paste">
          <label className="tami-map-location__sublabel" htmlFor={`field-paste-${idSuffix}`}>
            Dán từ Google Maps
          </label>
          <input
            aria-describedby={pasteProblem ? `field-paste-note-${idSuffix}` : undefined}
            id={`field-paste-${idSuffix}`}
            onBlur={(event) => applyPasteText(event.target.value)}
            onChange={(event) => {
              setPasteText(event.target.value);
              setPasteProblem(null);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault(); // Enter trong ô dán không được gửi cả form
              applyPasteText(event.currentTarget.value);
            }}
            onPaste={(event) => {
              event.preventDefault();
              const pasted = event.clipboardData.getData("text");
              setPasteText(pasted);
              applyPasteText(pasted);
            }}
            placeholder="Cặp số 10.7769, 106.7009 hoặc link Google Maps"
            type="text"
            value={pasteText}
          />
          {/* Luôn có trong DOM: vùng thông báo mới chèn vào thì một số trình đọc màn hình không đọc. */}
          <p className="tami-map-location__note" id={`field-paste-note-${idSuffix}`} role="status">
            {pasteProblem ? PASTE_MESSAGES[pasteProblem] : ""}
          </p>
        </div>
      )}
      <div className="field-type__wrap">
      <ul className="tami-map-location__coords">
        <li>
          <label className="tami-map-location__sublabel" htmlFor={`field-latitude-${idSuffix}`}>
            Vĩ độ
          </label>
          <div className="input-wrapper">
            {BeforeInput}
            <input
              disabled={locked}
              id={`field-latitude-${idSuffix}`}
              inputMode="decimal"
              name={`${path}.latitude`}
              onChange={(event) => setValue(nextPointValue(value, 1, event.target.value))}
              step={stepAttr}
              type="number"
              value={toInputValue(value?.[1])}
            />
            {AfterInput}
          </div>
        </li>
        <li>
          <label className="tami-map-location__sublabel" htmlFor={`field-longitude-${idSuffix}`}>
            Kinh độ
          </label>
          <div className="input-wrapper">
            {BeforeInput}
            <input
              disabled={locked}
              id={`field-longitude-${idSuffix}`}
              inputMode="decimal"
              name={`${path}.longitude`}
              onChange={(event) => setValue(nextPointValue(value, 0, event.target.value))}
              step={stepAttr}
              type="number"
              value={toInputValue(value?.[0])}
            />
            {AfterInput}
          </div>
        </li>
      </ul>
      {/* Lỗi nằm trong wrapper ngay dưới hai ô số (luật _field-errors.scss đẩy nó xuống cuối wrapper), trước link và mô tả. */}
      <RenderCustomComponent CustomComponent={Error} Fallback={<FieldError path={path} showError={showError} />} />
      </div>
      {mapsUrl && (
        <a className="tami-map-location__link" href={mapsUrl} rel="noopener noreferrer" target="_blank">
          Xem trên Google Maps
        </a>
      )}
      <RenderCustomComponent CustomComponent={Description} Fallback={<FieldDescription description={description} path={path} />} />
    </div>
  );
}
