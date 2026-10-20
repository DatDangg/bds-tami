import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface LeadFormSlotProps {
  /** Tiêu đề `h2` của khối (vd "Gửi yêu cầu tư vấn"). */
  title: string;
  /** Form lead thật (task lead-form-integration thay slot này); chưa có thì hiện `fallback`. */
  children?: ReactNode;
  /** Nội dung tạm khi chưa có form: hướng khách sang kênh liên hệ khác. */
  fallback?: ReactNode;
  /** `id` của khung (đích cuộn của nút CTA); mặc định `lead-form`. Form ứng tuyển dùng `apply-form`. */
  id?: string;
  /** `id` của tiêu đề `h2` (để phần tử ngoài nhãn `aria-labelledby`); mặc định tự sinh. */
  headingId?: string;
  /** Ghi đè lớp của khung (vd `scroll-mt-*` khi trang có thanh mục con dính dưới header). */
  className?: string;
}

/**
 * Vùng chừa sẵn cho form lead (layer-10-task-01 ráp `LeadForm` vào đây). Có `id="lead-form"` để nút "Ứng tuyển"/"Nhận tư vấn"
 * cuộn tới; nền `--color-primary-subtle` theo design-spec §3.4. Server Component, không có logic form.
 */
export function LeadFormSlot({ title, children, fallback, className, id = "lead-form", headingId }: LeadFormSlotProps) {
  const generatedHeadingId = useId();
  const titleId = headingId ?? generatedHeadingId;
  return (
    <section id={id} aria-labelledby={titleId} className={cn("scroll-mt-[calc(var(--sticky-top)+1rem)] rounded-lg bg-primary-subtle p-6 lg:p-8", className)}>
      <h2 id={titleId} className="mb-4 font-display text-h2-sm">
        {title}
      </h2>
      {children ?? fallback}
    </section>
  );
}
