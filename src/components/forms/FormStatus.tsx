"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";
import { CheckCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormStatusProps = {
  /** Mặc định "Cảm ơn anh/chị!" / "Thank you!". */
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Panel thành công thay cho form (design-spec §3.3): `role="status"` và chuyển focus tới tiêu đề khi hiện,
 * để người dùng bàn phím/trình đọc màn hình biết form đã gửi (vì form vừa biến mất khỏi DOM).
 */
export function FormStatus({ title, description, children, className }: FormStatusProps) {
  const t = useTranslations("form.success");
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div role="status" className={cn("flex flex-col gap-3 rounded-md bg-success-subtle p-6", className)}>
      <CheckCircle size={32} weight="fill" aria-hidden="true" className="text-success" />
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-h3 text-text">
        {title ?? t("title")}
      </h2>
      <p className="text-body text-text-secondary">{description ?? t("description")}</p>
      {children}
    </div>
  );
}

type FormErrorSummaryProps = {
  message: string;
  /** Các lỗi không gắn được vào ô nào (field lạ) hoặc lỗi trường cần nhắc lại. */
  details?: string[];
  tone?: "error" | "warning";
  /** Có thì hiện nút "Thử lại" (lỗi tạm thời: 500/503/mạng). */
  onRetry?: () => void;
  /** Hotline hiển thị khi gửi không được (429, lỗi hệ thống). */
  hotline?: { label: string; href: string };
  className?: string;
};

/** Hộp tóm tắt lỗi `role="alert"` đặt phía trên nút gửi: trình đọc màn hình đọc ngay khi xuất hiện. */
export function FormErrorSummary({ message, details, tone = "error", onRetry, hotline, className }: FormErrorSummaryProps) {
  const t = useTranslations("form");
  return (
    <div
      role="alert"
      className={cn("flex flex-col gap-2 rounded-md border p-4 text-small text-text", tone === "warning" ? "border-warning bg-warning-subtle" : "border-error bg-error-subtle", className)}
    >
      <p className="font-semibold">{message}</p>
      {details && details.length > 0 && (
        <ul className="list-disc pl-5">
          {[...new Set(details)].map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
      {(onRetry || hotline) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {onRetry && (
            <Button type="button" variant="outline" onClick={onRetry}>
              {t("actions.retry")}
            </Button>
          )}
          {hotline && (
            <a href={hotline.href} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
              {t("hotline")}: {hotline.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
