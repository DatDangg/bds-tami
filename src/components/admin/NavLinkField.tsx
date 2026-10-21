"use client";

import { FieldError, SelectInput, useField } from "@payloadcms/ui";
import type { OptionObject, TextFieldClientProps } from "payload";
import { useState } from "react";

import { isPageLinkKey, PAGE_LINK_KEY_LIST, PAGE_LINK_KEY_MEANINGS } from "@/lib/content/nav-link";

const OTHER_CHOICE = "__other__";
const PAGE_OPTIONS: OptionObject[] = [
  ...PAGE_LINK_KEY_LIST.map((key) => ({ label: PAGE_LINK_KEY_MEANINGS[key], value: key })),
  { label: "Địa chỉ khác (https://…)", value: OTHER_CHOICE },
];

/** Lựa chọn hiển thị cho giá trị lưu: mã trang → chính mã; URL/giá trị lạ → "địa chỉ khác"; trống → chưa chọn. */
export function navLinkChoice(value: unknown): string {
  const link = typeof value === "string" ? value.trim() : "";
  if (!link) return "";
  return isPageLinkKey(link) ? link : OTHER_CHOICE;
}

/** Giá trị react-select (option hoặc null khi bấm xoá) → lựa chọn; mã lạ coi như chưa chọn. */
export function navLinkChoiceFromSelection(selection: unknown): string {
  const option = Array.isArray(selection) ? selection[0] : selection;
  const value = option && typeof option === "object" && "value" in option ? (option as { value: unknown }).value : "";
  const known = PAGE_OPTIONS.find((candidate) => candidate.value === value);
  return known ? String(known.value) : "";
}

/** Ô nhập URL hiện khi chọn "Địa chỉ khác". */
function NavLinkUrlInput({ inputId, value, onChange, readOnly }: { inputId: string; value: string; onChange: (next: string) => void; readOnly?: boolean }) {
  return (
    <div className="tami-nav-link__url">
      <label className="field-label" htmlFor={inputId}>
        Địa chỉ (https://…)
      </label>
      <input id={inputId} inputMode="url" onChange={(event) => onChange(event.target.value)} placeholder="https://" readOnly={readOnly} type="text" value={value} />
    </div>
  );
}

/**
 * Ô "Liên kết" dùng chung (Header, Footer, nút Trang chủ): chọn trang theo tên tiếng Việt hoặc "Địa chỉ khác" rồi nhập URL.
 * Giá trị ghi vào field text y như trước (mã trang hoặc URL) nên dữ liệu cũ, validate, API và website không đổi.
 */
export function NavLinkField({ field, path, readOnly }: TextFieldClientProps) {
  const { value, setValue, showError } = useField<string>({ path });
  const currentValue = typeof value === "string" ? value : "";
  // Chọn "Địa chỉ khác" khi ô còn trống vẫn phải giữ ô nhập mở: lựa chọn không suy ra được từ giá trị rỗng.
  // Chỉ dùng trạng thái đã chọn đó khi giá trị đang rỗng; có giá trị (kể cả đổi từ ngoài: đặt lại, khôi phục phiên bản) thì lựa chọn suy ra từ chính giá trị.
  const [otherChosen, setOtherChosen] = useState(() => navLinkChoice(value) === OTHER_CHOICE);
  const choice = otherChosen && !currentValue ? OTHER_CHOICE : navLinkChoice(currentValue);
  const label = typeof field.label === "string" ? field.label : "Liên kết";
  const description = typeof field.admin?.description === "string" ? field.admin.description : undefined;
  const inputId = `field-${path.replace(/\./g, "__")}__url`;

  const selectChoice = (next: string) => {
    setOtherChosen(next === OTHER_CHOICE);
    // Đổi sang "Địa chỉ khác" từ một mã trang: bỏ mã cũ để ô nhập trống, không ghi mã trang vào ô URL.
    if (next === OTHER_CHOICE) {
      if (isPageLinkKey(currentValue.trim())) setValue("");
      return;
    }
    setValue(next);
  };

  return (
    <div className={`field-type text tami-nav-link${showError ? " error" : ""}`}>
      {/* Bọc <label> như ô lọc trạng thái dịch: FieldLabel htmlFor không trỏ được vào input của react-select. */}
      <label className="field-label">
        <span>
          {label}
          {field.required ? <span className="required">*</span> : null}
        </span>
        <SelectInput
          isClearable={!field.required}
          name={path}
          onChange={(selection) => selectChoice(navLinkChoiceFromSelection(selection))}
          options={PAGE_OPTIONS}
          path={path}
          placeholder="Chọn trang…"
          readOnly={readOnly}
          required={field.required}
          showError={showError}
          value={choice}
        />
      </label>
      {choice === OTHER_CHOICE ? <NavLinkUrlInput inputId={inputId} onChange={setValue} readOnly={readOnly} value={currentValue} /> : null}
      <FieldError path={path} showError={showError} />
      {description ? <div className="field-description">{description}</div> : null}
    </div>
  );
}
