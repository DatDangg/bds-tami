"use client";

import Image, { type ImageLoader } from "next/image";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type MediaSize = { url?: string | null; width?: number | null };

/** Tập con của doc `media` (payload-types) mà component cần; nơi dùng truyền thẳng doc đã populate. */
export type MediaImage = {
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  sizes?: { thumb?: MediaSize; card?: MediaSize; large?: MediaSize };
};

type Candidate = { url: string; width: number };

// Cỡ đã sinh khi upload (ERD §4.12). `og` bị cắt 1200x630 nên không dùng làm ảnh hiển thị.
// Ảnh gốc giữ nguyên dung lượng/định dạng upload (có thể nhiều MB) nên chỉ là phương án cuối khi chưa có cỡ nào được sinh.
export function listCandidates(media: MediaImage): Candidate[] {
  const generated = [media.sizes?.thumb, media.sizes?.card, media.sizes?.large].filter(hasUrlAndWidth);
  const candidates = generated.length > 0 ? generated : [{ url: media.url, width: media.width }].filter(hasUrlAndWidth);
  return candidates.sort((a, b) => a.width - b.width);
}

function hasUrlAndWidth(size: MediaSize | undefined): size is Candidate {
  return Boolean(size?.url && size.width);
}

/**
 * Loader trả về đúng file đã sinh gần nhất >= bề rộng yêu cầu (không có thì lấy file lớn nhất).
 * Ảnh nhỏ hơn cỡ đích không có cỡ đó (Media.ts), nên rơi về cỡ đã sinh còn lại.
 * Nhờ vậy ảnh không bị tối ưu lại lần nữa và không cần `remotePatterns` cho nơi media được serve.
 */
export function pickGeneratedSize(candidates: Candidate[], requestedWidth: number): string {
  // Gọi với danh sách rỗng là lỗi lập trình: component đã chặn trước (không render khi không có URL).
  const match = candidates.find((candidate) => candidate.width >= requestedWidth) ?? candidates.at(-1);
  return match?.url ?? "";
}

type ResponsiveImageProps = {
  media: MediaImage;
  /** Thuộc tính `sizes` đúng theo cột nơi ảnh hiển thị (design-spec §1.3). */
  sizes: string;
  /** Tỉ lệ cố định, vd "4/3": giữ chỗ trước khi ảnh tải để CLS = 0. Bỏ qua nếu khung cha đã có kích thước. */
  aspectRatio?: string;
  /** Ảnh LCP: `preload` (Next 16, thay `priority`) + `fetchPriority="high"`. Mọi ảnh khác lazy. */
  priority?: boolean;
  fit?: "cover" | "contain";
  /** Ghi đè `media.alt` (vd chú thích do nơi dùng cung cấp). */
  alt?: string;
  /** Ảnh trang trí: `alt=""`. */
  decorative?: boolean;
  className?: string;
};

export function ResponsiveImage({
  media,
  sizes,
  aspectRatio,
  priority = false,
  fit = "cover",
  alt,
  decorative = false,
  className,
}: ResponsiveImageProps) {
  const candidates = useMemo(() => listCandidates(media), [media]);
  const loader = useMemo<ImageLoader>(
    () =>
      ({ width }) =>
        pickGeneratedSize(candidates, width),
    [candidates],
  );
  const largest = candidates.at(-1);
  if (!largest) return null;
  const resolvedAlt = decorative ? "" : (alt ?? media.alt ?? "");

  return (
    <div className={cn("relative size-full overflow-hidden", className)} style={aspectRatio ? { aspectRatio } : undefined}>
      <Image
        loader={loader}
        src={largest.url}
        alt={resolvedAlt}
        fill
        sizes={sizes}
        preload={priority}
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? undefined : "lazy"}
        className={fit === "cover" ? "object-cover" : "object-contain"}
      />
    </div>
  );
}
