import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { ServiceCardData } from "@/lib/services/service-view";
import { cn } from "@/lib/utils";

/**
 * Thẻ Dịch vụ (design-spec §3.2): ảnh bìa 4:5, tên + mô tả ngắn chữ trắng đè trên scrim đáy. Cả thẻ là MỘT link;
 * tên là heading `h3` (thẻ nằm dưới `h2` "Dịch vụ khác"). Không có ảnh bìa: nền tối đặc, chữ vẫn đọc được. Server Component.
 * `className` đổi tỉ lệ/kích thước khung (bento trang chủ).
 */
export function ServiceCard({ data, className }: { data: ServiceCardData; className?: string }) {
  return (
    <Link
      href={data.href}
      className={cn(
        "group theme-dark-block relative isolate flex aspect-[4/5] min-h-11 flex-col justify-end overflow-hidden rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring",
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
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-dark-deep/85 via-dark-deep/30 to-transparent" />
      <div className="flex flex-col gap-2 p-6">
        <h3 className="font-display text-h3 text-on-dark">{data.title}</h3>
        {data.summary && <p className="line-clamp-2 text-small text-on-dark-muted">{data.summary}</p>}
        <ArrowRight
          size={24}
          aria-hidden="true"
          className="text-on-dark transition-transform duration-(--duration-base) group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        />
      </div>
    </Link>
  );
}
