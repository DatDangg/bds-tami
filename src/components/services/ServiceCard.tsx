import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { ServiceCardData } from "@/lib/services/service-view";
import { cn } from "@/lib/utils";

/**
 * Thẻ Dịch vụ (design-spec §3.2, BL-020): ảnh bìa phủ kín bo 20px, tên + mô tả ngắn nằm trong khung kính mờ `.glass-panel` đè đáy ảnh
 * (cùng quy tắc kính với thẻ dự án: nền đặc mặc định, chỉ dùng `--color-text` để đạt 4.5:1 dù ảnh sau kính đen hay trắng). Cả thẻ là MỘT link;
 * tên là heading `h3`. Không có ảnh bìa: nền tối đặc, khung kính vẫn đọc được. Server Component. `className` đổi tỉ lệ/kích thước khung (bento trang chủ).
 */
export function ServiceCard({ data, className }: { data: ServiceCardData; className?: string }) {
  return (
    <Link
      href={data.href}
      className={cn(
        "group relative isolate flex aspect-[4/5] min-h-11 flex-col justify-end overflow-hidden rounded-xl bg-dark-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring",
        className,
      )}
    >
      {data.cover && (
        <ResponsiveImage
          media={data.cover}
          sizes="(min-width: 1024px) 600px, (min-width: 768px) 50vw, 100vw"
          decorative
          className="absolute inset-0 -z-10 transition-transform duration-(--duration-slow) group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      )}
      <div className="glass-panel m-3 flex flex-col gap-2 rounded-lg p-4 text-text sm:m-4 sm:p-5">
        <h3 className="font-display text-h3">{data.title}</h3>
        {data.summary && <p className="line-clamp-2 text-small">{data.summary}</p>}
        <ArrowRight
          size={24}
          aria-hidden="true"
          className="transition-transform duration-(--duration-base) group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        />
      </div>
    </Link>
  );
}
