"use client";

import { RelationshipInput, useField, useFormFields } from "@payloadcms/ui";
import type { RelationshipFieldClientProps, Where } from "payload";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { relationId } from "@/lib/payload/relation-id";

/** Đường dẫn ô `province` cùng cấp với ô `ward` (ô nằm trong nhóm/hàng lồng nhau vẫn đúng). */
export function provincePathOf(wardPath: string): string {
  return wardPath.replace(/ward$/, "province");
}

const WARD_RELATION = ["wards"];
const toOption = (id: unknown) => (id ? { relationTo: "wards", value: id as string | number } : null);

/** `filterOptions` của RelationshipInput khoá theo slug quan hệ (`{ wards: Where }`); lọc theo tỉnh đang chọn ở form (tính ở client, không chờ form-state round-trip); chưa chọn tỉnh = không lọc. */
export function wardFilterForProvince(province: unknown): Record<string, Where> | undefined {
  const provinceId = relationId(province);
  return provinceId ? { wards: { province: { equals: provinceId } } } : undefined;
}

const formatWardOptions = (options: { options: unknown }[]) => options.map((option) => option.options).flat() as never;

/** Chỉ bỏ chọn phường khi NGƯỜI DÙNG đổi từ tỉnh A sang tỉnh khác; lần render đầu / nạp bản ghi (trước đó chưa có tỉnh) thì giữ. */
export function shouldResetWard(previousProvinceId: string | null, nextProvinceId: string | null): boolean {
  return previousProvinceId !== null && previousProvinceId !== nextProvinceId;
}

/**
 * Ô Phường/xã dùng chung (Dự án, Cho thuê, Tin BĐS): như ô quan hệ mặc định của Payload nhưng lọc theo tỉnh ngay ở client và
 * tự bỏ chọn khi đổi tỉnh. `validate` server giữ nguyên là chốt chặn.
 */
export function WardField({ field, path: pathFromProps, readOnly, validate }: RelationshipFieldClientProps) {
  const { admin: { allowCreate = true, allowEdit = true, className, description, isSortable = true, placeholder } = {}, label, localized, required } = field;
  const memoizedValidate = useCallback(
    (value: unknown, validationOptions: object) => (typeof validate === "function" ? (validate as (v: unknown, o: object) => unknown)(value, { ...validationOptions, required }) : undefined),
    [validate, required],
  );
  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    initialValue,
    path,
    setValue,
    showError,
    value,
  } = useField<string | number | null>({ potentiallyStalePath: pathFromProps, validate: memoizedValidate as never });
  const provinceValue = useFormFields(([fields]) => fields[provincePathOf(path)]?.value);
  const provinceId = relationId(provinceValue);

  // Ổn định theo tỉnh: Input.js xoá + tải lại danh sách mỗi khi tham chiếu filterOptions đổi.
  const filterOptions = useMemo(() => wardFilterForProvince(provinceId), [provinceId]);

  const previousProvinceId = useRef<string | null>(provinceId);
  useEffect(() => {
    if (shouldResetWard(previousProvinceId.current, provinceId) && value) setValue(null);
    previousProvinceId.current = provinceId;
  }, [provinceId, value, setValue]);

  const handleChange = useCallback(
    (next: { value: string | number } | null) => setValue(next ? next.value : null, Boolean(value) && next?.value === value),
    [setValue, value],
  );
  return (
    <RelationshipInput
      AfterInput={AfterInput}
      allowCreate={allowCreate}
      allowEdit={allowEdit}
      appearance="select"
      BeforeInput={BeforeInput}
      className={className}
      Description={Description}
      description={description}
      Error={Error}
      filterOptions={filterOptions as never}
      formatDisplayedOptions={formatWardOptions}
      hasMany={false}
      initialValue={toOption(initialValue) as never}
      isSortable={isSortable}
      Label={Label}
      label={label}
      localized={localized}
      maxResultsPerRequest={10}
      onChange={handleChange}
      path={path}
      placeholder={placeholder}
      readOnly={readOnly || disabled}
      relationTo={WARD_RELATION}
      required={required}
      showError={showError}
      style={undefined}
      value={toOption(value) as never}
    />
  );
}
