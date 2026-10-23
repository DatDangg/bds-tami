"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CloudArrowUp, FileText, WarningCircle, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CvPickerProps = {
  name: string;
  accept: string;
  file: File | null;
  disabled: boolean;
  error?: string;
  labels: {
    field: string;
    required: string;
    helper: string;
    chooseFile: string;
    dropHint: string;
    removeFile: (fileName: string) => string;
  };
  /** Nhận file từ hộp chọn hoặc kéo-thả; `undefined` khi người dùng huỷ hộp chọn. Cha validate + giữ state. */
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Ô CV của form ứng tuyển (design-spec §3.4; trình bày BL-054 `chi-tiet-tuyen-dung.webp`): nút "Chọn tệp" ở mọi cỡ (< md nút viền; ≥ md thành chữ nhấn
 * nằm trong câu gợi ý, vẫn giữ vùng chạm ≥ 44px bằng `md:min-h-11`), vùng kéo-thả viền nét đứt có icon tải lên + định dạng/dung lượng chỉ từ md; tệp đã chọn hiện thành thẻ (icon tệp, tên, dung lượng, nút xoá).
 * Input file thật ẩn (sr-only, ngoài tab order) nhưng vẫn mang label/aria-invalid/aria-describedby để trình đọc màn hình
 * và test đọc được; bàn phím dùng nút "Chọn tệp" (nút thật, focusable, cũng mang aria-invalid để nhận focus khi lỗi). Input chỉ là hộp chọn (xoá sau mỗi lần chọn): file — dù chọn hay thả — đều do cha giữ trong state và gửi qua `additionalFields`.
 */
export function CvPicker({ name, accept, file, disabled, error, labels, onPick, onRemove }: CvPickerProps) {
  const reactId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const inputId = `${reactId}-${name}`;
  const helperId = `${inputId}-helper`;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    // Input chỉ là hộp chọn: xoá ngay để file sai/đã xoá không bị FormData(form) gửi lên; file hợp lệ sống trong state của cha (như file thả).
    event.target.value = "";
    onPick(picked);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    // preventDefault để trình duyệt cho phép thả vào đây thay vì mở file.
    event.preventDefault();
    if (!disabled && !dragging) setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // Rời sang phần tử con vẫn là trong vùng: không bỏ highlight để tránh nhấp nháy.
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files[0];
    if (dropped) onPick(dropped);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-small font-semibold text-text">
        {labels.field}
        <span aria-hidden="true" className="ml-0.5 text-error">
          *
        </span>
        <span className="sr-only"> ({labels.required})</span>
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-dragging={dragging || undefined}
        className={cn(
          "flex flex-col gap-3 md:items-center md:gap-1.5 md:rounded-md md:border md:border-dashed md:border-input md:bg-surface md:px-4 md:py-5 md:text-center",
          "transition-colors duration-(--duration-fast) motion-reduce:transition-none",
          error && "md:border-error",
          // Đứng sau `error` để lúc kéo vào ô đang lỗi vẫn thấy highlight (tailwind-merge giữ class sau).
          dragging && "md:border-primary md:bg-primary-subtle",
          disabled && "md:opacity-50",
        )}
      >
        <CloudArrowUp size={28} aria-hidden="true" className="hidden text-accent-text md:block" />
        <p className="hidden text-small text-text-secondary md:block">{labels.dropHint}</p>
        {/* Nút đứng TRƯỚC input và cũng mang aria-invalid để "focus ô lỗi đầu tiên" (usePublicForm) rơi vào phần tử nhìn thấy được, không vào input sr-only (WCAG 2.4.7).
            Focus do code gọi `.focus()` không chắc khớp `:focus-visible` → khi lỗi, `focus:` luôn vẽ vòng; viền lỗi hiện ở mọi cỡ (design-spec §3.3). */}
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="w-full sm:w-fit md:h-auto md:min-h-11 md:border-0 md:bg-transparent md:px-0 md:text-small md:normal-case md:text-accent-text md:hover:bg-transparent md:hover:text-text aria-invalid:border-error aria-invalid:focus:outline-2 aria-invalid:focus:outline-offset-2 aria-invalid:focus:outline-focus-ring"
        >
          {labels.chooseFile}
        </Button>
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          required
          aria-required="true"
          tabIndex={-1}
          disabled={disabled}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="sr-only"
        />
        <p id={helperId} className="text-small text-text-muted">
          {labels.helper}
        </p>
      </div>
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-small text-error">
          <WarningCircle size={16} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {file && (
        <div className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-surface py-1 pr-1 pl-3 text-small text-text">
          <FileText size={28} aria-hidden="true" className="shrink-0 text-accent-text" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-semibold">{file.name}</span>
            <span className="text-text-muted">{formatFileSize(file.size)}</span>
          </span>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={labels.removeFile(file.name)}
            className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm text-text-secondary hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
