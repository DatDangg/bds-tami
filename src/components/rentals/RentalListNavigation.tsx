"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useTransition } from "react";
import { cn } from "@/lib/utils";

interface RentalListNavigation {
  /** Có lần đổi URL đang chờ server dựng lại danh sách. */
  pending: boolean;
  /** Đổi query của trang (đã gồm `?` hoặc rỗng); `router.replace` + `scroll: false` để không nhảy trang và không đầy lịch sử (design-spec §3.5). */
  navigate: (query: string) => void;
}

const NavigationContext = createContext<RentalListNavigation | null>(null);

/**
 * Bao toàn bộ khu lọc + kết quả của `/cho-thue`: bộ lọc (client) đổi URL, server dựng lại danh sách, `PendingRegion` mờ đi tới khi xong.
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
  return <NavigationContext value={value}>{children}</NavigationContext>;
}

export function useRentalListNavigation(): RentalListNavigation {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useRentalListNavigation phải nằm trong RentalListNavigationProvider");
  return context;
}

/** Vùng kết quả: đang đổi bộ lọc thì giữ lưới cũ, mờ 50% + `aria-busy` (không nhảy layout, design-spec S04). */
export function PendingRegion({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useRentalListNavigation();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-(--duration-fast)", pending && "opacity-50", className)}>
      {children}
    </div>
  );
}
