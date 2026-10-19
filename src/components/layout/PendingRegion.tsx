"use client";

import Link, { useLinkStatus } from "next/link";
import { useFormStatus } from "react-dom";
import { type ComponentProps, createContext, type ReactNode, useCallback, useContext, useEffect, useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Phản hồi chờ phía trình duyệt cho trang danh sách `force-dynamic` (design-spec §3.5; thay `loading.tsx` vì nó gây soft-404, xem
 * `list-no-loading.test.ts`): link phân trang/chip/tab và form lọc báo "đang chờ" lên đây, `PendingRegion` mờ đi + `aria-busy` tới khi server dựng xong.
 */
interface ListPendingContext {
  pending: boolean;
  report: (sourceId: string, pending: boolean) => void;
}

const PendingContext = createContext<ListPendingContext | null>(null);

export function ListPendingProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<ReadonlySet<string>>(new Set());
  const report = useCallback((sourceId: string, pending: boolean) => {
    setSources((current) => {
      if (current.has(sourceId) === pending) return current;
      const next = new Set(current);
      if (pending) next.add(sourceId);
      else next.delete(sourceId);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ pending: sources.size > 0, report }), [sources, report]);
  return <PendingContext value={value}>{children}</PendingContext>;
}

/** Đăng ký nguồn chờ với vùng gần nhất; nhả khi hết chờ hoặc khi unmount. Ngoài provider thì không làm gì. */
export function useReportPending(pending: boolean) {
  const context = useContext(PendingContext);
  const sourceId = useId();
  const report = context?.report;
  useEffect(() => {
    report?.(sourceId, pending);
    return () => report?.(sourceId, false);
  }, [report, sourceId, pending]);
}

/** Vùng kết quả: đang chờ thì giữ nội dung cũ, mờ 50% + `aria-busy` (không đổi kích thước nên không gây CLS). `forcePending` cho nguồn chờ riêng (vd bộ lọc `/cho-thue`). */
export function PendingRegion({ children, className, forcePending = false }: { children: ReactNode; className?: string; forcePending?: boolean }) {
  const pending = (useContext(PendingContext)?.pending ?? false) || forcePending;
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-(--duration-fast) motion-reduce:transition-none", pending && "opacity-50", className)}>
      {children}
    </div>
  );
}

/** Nằm trong `<Link>`: báo trạng thái chờ của link đó. Span ẩn mang `data-link-pending` để link tự đổi kiểu bằng `has-[...]`. */
function LinkPendingMarker() {
  const { pending } = useLinkStatus();
  useReportPending(pending);
  return <span hidden data-link-pending={pending} />;
}

/** `<Link>` có chỉ báo chờ (mờ nhẹ + con trỏ chờ) và báo lên `PendingRegion`; không chặn bấm tiếp. */
export function PendingLink({ children, className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={cn("has-[[data-link-pending=true]]:cursor-progress has-[[data-link-pending=true]]:opacity-60", className)}>
      {children}
      <LinkPendingMarker />
    </Link>
  );
}

/** Nằm trong `<Form>` (next/form): báo trạng thái chờ khi gửi bộ lọc. */
export function FormPendingMarker() {
  const { pending } = useFormStatus();
  useReportPending(pending);
  return null;
}
