"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useTransition } from "react";
import { ListPendingProvider, PendingRegion as ListPendingRegion } from "@/components/layout/PendingRegion";

interface RentalListNavigation {
  /** Có lần đổi URL đang chờ server dựng lại danh sách. */
  pending: boolean;
  /** Đổi query của trang (đã gồm `?` hoặc rỗng); `router.replace` + `scroll: false` để không nhảy trang và không đầy lịch sử (design-spec §3.5). */
  navigate: (query: string) => void;
}

const NavigationContext = createContext<RentalListNavigation | null>(null);

/**
 * Bao toàn bộ khu lọc + kết quả của `/cho-thue`: bộ lọc (client) đổi URL, server dựng lại danh sách, `RentalPendingRegion` mờ đi tới khi xong.
 * `actionPath` là đường dẫn công khai của chính trang (đã có tiền tố ngôn ngữ).
 */
export function RentalListNavigationProvider({ actionPath, children }: { actionPath: string; children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback(
    (query: string) => startTransition(() => router.replace(`${actionPath}${query}`, { scroll: false })),
    [actionPath, router],
  );
  const value = useMemo(() => ({ pending, navigate }), [pending, navigate]);
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
