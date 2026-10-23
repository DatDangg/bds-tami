"use client";

import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";
import { WarningCircle } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";

type ConsentCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Lỗi đã dịch ("Vui lòng đồng ý để gửi thông tin."); có giá trị => aria-invalid. */
  error?: string;
  disabled?: boolean;
  /** Câu đồng ý riêng (vd form bản tin): nhận hàm bọc chữ thành link chính sách. Thiếu thì dùng `form.consent.label`. */
  label?: (policyLink: (chunks: ReactNode) => ReactNode) => ReactNode;
};

/**
 * Ô đồng ý xử lý dữ liệu cá nhân (FR-PUB-13, BR-30). Link chính sách dùng route `/chinh-sach-bao-mat`
 * của next-intl nên tự ra `/chinh-sach-bao-mat` hoặc `/en/privacy-policy` theo ngôn ngữ đang xem.
 * Component chỉ giữ trạng thái tick; thời điểm + phiên bản chính sách do server lưu khi nhận `consent: true`.
 */
export function ConsentCheckbox({ checked, onCheckedChange, error, disabled, label }: ConsentCheckboxProps) {
  const t = useTranslations("form");
  const id = useId();
  const newTabId = `${id}-new-tab`;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        {/* Vùng chạm ≥44px do after:-inset-3 của Checkbox; đệm py giữ khoảng cách với hàng kế. */}
        <Checkbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5"
        />
        <label htmlFor={id} className="cursor-pointer text-small text-text">
          {(label ?? ((link) => t.rich("consent.label", { policy: link })))((chunks) => (
            <Link
              href="/chinh-sach-bao-mat"
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby={newTabId}
              className="inline-block min-h-6 font-semibold text-accent-text transition-colors duration-(--duration-fast) hover:text-text"
            >
              {chunks}
            </Link>
          ))}
        </label>
        <span id={newTabId} className="sr-only">
          {t("consent.newTab")}
        </span>
      </div>
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-small text-error">
          <WarningCircle size={16} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
