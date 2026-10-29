import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";

/** Nút "Xem thêm / Xem tất cả" cuối khối trang chủ (BL-101): ghost + mũi tên →, dùng chung mọi khối. */
export function SectionMoreLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Button asChild variant="ghost" className={className}>
      <Link href={href}>
        {children}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </Button>
  );
}
