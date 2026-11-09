import { useTranslations } from "next-intl";
import { useId } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { PartnerItemView, PartnersBlockView } from "@/lib/home/home-view-partners";
import { cn } from "@/lib/utils";
import { PartnersMarqueeShell } from "./PartnersMarqueeShell";
import { SectionHeading } from "./SectionHeading";

/** Logo hiển thị trong khung cố định 96x48 (giữ tỉ lệ, `contain`): dải không nhảy theo kích thước từng ảnh nên không CLS. */
const LOGO_SIZES = "96px";
/** Giây cho một vòng mỗi mục (≈ 4s/mục ~ 55px/s); tối thiểu để dải ít mục không chạy quá nhanh. */
const SECONDS_PER_ITEM = 4;
const MIN_LOOP_SECONDS = 24;
/** Từ ngần này đối tác trở xuống không đáng chạy: hàng tĩnh căn giữa, không bản nhân đôi, không nút. */
export const PARTNERS_STATIC_MAX = 4;

type ListMode = "static" | "loop" | "duplicate";

const ITEM_PAD = "px-6 sm:px-8";
const LINK_FOCUS = "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring";

/** Logo xám + mờ, về màu gốc khi hover / focus mục (design-spec S01). Tên đứng cạnh nên logo là ảnh trang trí (không đọc trùng). */
function PartnerContent({ item, running }: { item: PartnerItemView; running: boolean }) {
  return (
    <>
      {item.logo && (
        <span className="relative block h-12 w-24 shrink-0 opacity-70 grayscale transition duration-(--duration-fast) group-focus-within/item:opacity-100 group-focus-within/item:grayscale-0 group-hover/item:opacity-100 group-hover/item:grayscale-0">
          <ResponsiveImage media={item.logo} sizes={LOGO_SIZES} fit="contain" decorative />
        </span>
      )}
      {/* Dải đang chạy: tên không xuống dòng. Tĩnh / reduced-motion: cho xuống dòng, không tràn ngang. */}
      <span className={cn("min-w-0 text-base font-semibold text-text-secondary [overflow-wrap:anywhere]", running && "whitespace-nowrap motion-reduce:whitespace-normal")}>
        {item.name}
      </span>
    </>
  );
}

/**
 * Một bản của danh sách. Ở chế độ `loop` mỗi bản rộng ≥ 100vw để hai bản nối nhau luôn lấp đầy khung; khoảng cách nằm ở padding từng mục
 * (không dùng gap) nên hai bản dài đúng bằng nhau → vòng lặp liền mạch.
 */
function PartnerList({ items, mode, label }: { items: PartnerItemView[]; mode: ListMode; label: string }) {
  const duplicate = mode === "duplicate";
  const running = mode !== "static";
  return (
    <ul
      // Bản nhân đôi chỉ phục vụ hiệu ứng vòng: ẩn khỏi trình đọc màn hình, không focus được; reduced-motion thì bỏ hẳn.
      {...(duplicate ? { "aria-hidden": true, inert: true } : { "aria-label": label })}
      className={cn(
        mode === "static"
          ? "mx-auto flex max-w-container flex-wrap items-center justify-center gap-y-6 px-gutter"
          : "flex min-w-[100vw] shrink-0 items-center justify-around motion-reduce:w-full motion-reduce:min-w-0 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6",
        duplicate && "motion-reduce:hidden",
      )}
    >
      {items.map((item) => (
        <li key={item.id} className={cn("group/item flex max-w-full min-w-0 items-center", running && "shrink-0 motion-reduce:shrink", ITEM_PAD)}>
          {item.website ? (
            // Tên truy cập = tên đối tác (logo trang trí). Mở tab mới: `noopener noreferrer` chặn truy cập `window.opener`.
            <a href={item.website} target="_blank" rel="noopener noreferrer" className={cn("flex min-w-0 items-center gap-3", LINK_FOCUS)}>
              <PartnerContent item={item} running={running} />
            </a>
          ) : (
            <span className="flex min-w-0 items-center gap-3">
              <PartnerContent item={item} running={running} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Khối "Đối tác" (FR-PUB-17, BL-107): dải logo + tên chạy ngang tự động bằng CSS; chỉ nút Dừng / Phát là client (`PartnersMarqueeShell`).
 * Dừng khi hover hoặc focus bàn phím trong dải (mục có `website` là link nên Tab dừng được dải; không có link thì bàn phím dùng nút Dừng).
 * `prefers-reduced-motion: reduce`: không chạy, mục xuống dòng, đọc được hết. ≤ 4 đối tác: hàng tĩnh căn giữa. Server Component.
 */
export function PartnersMarquee({ block }: { block: PartnersBlockView }) {
  const t = useTranslations("page.home.partners");
  const headingId = useId();
  const isStatic = block.items.length <= PARTNERS_STATIC_MAX;
  const loopSeconds = Math.max(MIN_LOOP_SECONDS, block.items.length * SECONDS_PER_ITEM);
  const label = t("region");
  return (
    <section aria-labelledby={headingId} className="bg-bg py-section">
      <div className="mx-auto w-full max-w-container px-gutter">
        <SectionHeading id={headingId} title={block.title || t("defaultTitle")} />
      </div>
      {isStatic ? (
        <PartnerList items={block.items} mode="static" label={label} />
      ) : (
        <PartnersMarqueeShell loopSeconds={loopSeconds}>
          <PartnerList items={block.items} mode="loop" label={label} />
          <PartnerList items={block.items} mode="duplicate" label={label} />
        </PartnersMarqueeShell>
      )}
    </section>
  );
}
