import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo TAMI từ file tĩnh (không phụ thuộc site-settings, nên header/footer vẫn đúng khi global trống).
 * `tone="on-dark"` dùng bản trắng cho khối tối (footer, menu toàn màn hình), mặc định bản đen cho header đặc.
 * `alt` rỗng khi logo nằm trong link đã có tên truy cập.
 */
export function BrandLogo({ tone = "on-light", className }: { tone?: "on-light" | "on-dark"; className?: string }) {
  return (
    <Image
      src={tone === "on-dark" ? "/brand/tami-logo-white.png" : "/brand/tami-logo-dark.png"}
      alt=""
      width={800}
      height={416}
      className={cn("h-10 w-auto lg:h-12", className)}
    />
  );
}
