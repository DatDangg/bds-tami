"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useTransition } from "react";
import { ListPendingProvider, PendingRegion as ListPendingRegion } from "@/components/layout/PendingRegion";
import type { RentalFilters } from "@/lib/search/url-params";
import { type FilterDraft, useLiveDraft } from "./use-rental-draft";

interface RentalListNavigation {
  /** Đường dẫn công khai của trang (đã có tiền tố ngôn ngữ): `action` của form GET. */
  actionPath: string;
  /** Có lần đổi URL đang chờ server dựng lại danh sách. */
  pending: boolean;
  /** Đổi query của trang (đã gồm `?` hoặc rỗng); `router.replace` + `scroll: false` để không nhảy trang và không đầy lịch sử (design-spec §3.5). */
  navigate: (query: string) => void;
  /** Bản nháp DUY NHẤT của mọi bộ lọc + sắp xếp (băng, Popover, ô Sắp xếp dùng chung) để không ô nào dựng URL từ giá trị cũ của ô khác. */
  draft: FilterDraft;
  update: (patch: Partial<FilterDraft>, mode: "now" | "typing") => void;
  /** Áp dụng ngay bản nháp hiện tại (kể cả chữ đang chờ debounce). */
  submit: () => void;
}

const NavigationContext = createContext<RentalListNavigation | null>(null);

/**
 * Bao toàn bộ khu lọc + kết quả của `/cho-thue`: bộ lọc (client) đổi URL, server dựng lại danh sách, `RentalPendingRegion` mờ đi tới khi xong.
 * `actionPath` là đường dẫn công khai của chính trang (đã có tiền tố ngôn ngữ); `filters` là bộ lọc đang trên URL (nguồn sự thật của bản nháp).
 */
export function RentalListNavigationProvider({ actionPath, filters, children }: { actionPath: string; filters: RentalFilters; children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback(
    (query: string) => startTransition(() => router.replace(`${actionPath}${query}`, { scroll: false })),
    [actionPath, router],
  );
  const { draft, update, submit } = useLiveDraft(filters, navigate);
  const value = { actionPath, pending, navigate, draft, update, submit };
  return (
    <NavigationContext value={value}>
      <ListPendingProvider>{children}</ListPendingProvider>
    </NavigationContext>
  );
}

export function useRentalListNavigation(): RentalListNavigation {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useRentalListNavigation phải nằm trong RentalListNavigationProvider");
  return context;
}

/** Vùng kết quả của `/cho-thue`: chờ khi đổi bộ lọc (transition) hoặc khi bấm link phân trang/chip (design-spec S04). */
export function RentalPendingRegion({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useRentalListNavigation();
  return (
    <ListPendingRegion forcePending={pending} {...(className ? { className } : {})}>
      {children}
    </ListPendingRegion>
  );
}
