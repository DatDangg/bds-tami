import Image from "next/image";
import { cn } from "@/lib/utils";
import type { LogoImageView } from "./shell-data";

/** Logo tĩnh mặc định (`public/brand/`), dùng khi `site-settings.logo`/`logoDark` chưa cấu hình (docs/DESIGN.md § Logo): vàng cho nền sáng (header đặc), trắng cho nền tối. */
const STATIC_LOGO: Record<"on-light" | "on-dark", LogoImageView> = {
  "on-light": { url: "/brand/tami-logo-gold.png", width: 800, height: 416 },
  "on-dark": { url: "/brand/tami-logo-white.png", width: 800, height: 416 },
};

/**
 * Logo TAMI: bản từ CMS (`image`, chỉ URL + kích thước, xem `buildLogo`) hoặc file tĩnh khi global trống/lỗi.
 * `tone="on-dark"` dùng cho khối tối (header trong suốt, footer, menu toàn màn hình), mặc định cho header đặc.
 * `unoptimized`: ảnh CMS đã là cỡ `card` (webp) sinh khi upload, không tối ưu lại lần nữa (cùng cách `ResponsiveImage`),
 * nên không cần `remotePatterns` cho nơi media được phục vụ. `alt` rỗng khi logo nằm trong link đã có tên truy cập.
 */
export function BrandLogo({
  tone = "on-light",
  image,
  className,
}: {
  tone?: "on-light" | "on-dark";
  image?: LogoImageView;
  className?: string;
}) {
  const { url, width, height } = image ?? STATIC_LOGO[tone];
  // `max-w-[7.5rem]` chặn logo CMS quá ngang (vd 3:1 → 144px) đè menu ở hàng header 1280px (BL-001 MAJOR-1); header siết thêm
  // ở xl qua `className`. Logo tĩnh 800×416 ở h-12 rộng ≈ 92px nên không bị cắt. `object-contain object-left` giữ tỉ lệ, neo trái.
  return (
    <Image
      src={url}
      alt=""
      width={width}
      height={height}
      unoptimized={Boolean(image)}
      className={cn("h-10 w-auto max-w-[7.5rem] object-contain object-left lg:h-12", className)}
    />
  );
}
