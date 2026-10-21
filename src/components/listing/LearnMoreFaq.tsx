import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";
import { ArrowRight, CaretDown } from "@/components/icons";
import { type MediaImage, ResponsiveImage } from "@/components/media/ResponsiveImage";
import { parseVideoUrl } from "@/components/media/video-url";
import { JsonLd } from "@/components/seo/JsonLd";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { buildFaqPageJsonLd } from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils";
import { LearnMoreVideoButton } from "./LearnMoreVideoButton";

export interface LearnMoreContent {
  eyebrow?: string | null;
  /** Bắt buộc để khối hiện (thiếu tiêu đề ở ngôn ngữ đang xem → trang truyền `null`). */
  title: string;
  /** Phần tiêu đề màu nhấn (dòng 2). */
  titleAccent?: string | null;
  description?: string | null;
  image?: MediaImage | null;
  /** YouTube / TikTok; không hợp lệ → không có nút phát. */
  videoUrl?: string | null;
  /** `href` đã phân giải (nội bộ có tiền tố ngôn ngữ, hoặc `https://…`). Thiếu nhãn / href → không có nút. */
  cta?: { label: string; href: string } | null;
}

export interface FaqItem {
  question: string;
  answer: string;
}

interface LearnMoreFaqProps {
  learnMore?: LearnMoreContent | null;
  /** Câu hỏi ở ngôn ngữ đang xem (đã bỏ câu thiếu chữ). */
  faqs?: readonly FaqItem[];
  /** Phát JSON-LD `FAQPage`: chỉ ở trang sạch (trang 1, không lọc / `q` / sắp xếp) — trang quyết định. */
  emitJsonLd?: boolean;
  className?: string;
}

const isExternal = (href: string) => /^https?:\/\//i.test(href);

/**
 * Hàng cuối trang danh sách (BL-052, design `list-du-an`): trái khối "Tìm hiểu thêm" (ảnh + nút phát video → Dialog/VideoFacade, eyebrow, tiêu đề 2 màu, mô tả, nút),
 * phải "Câu hỏi thường gặp" (`details/summary` gốc — chạy không JS, bàn phím sẵn) + JSON-LD `FAQPage` khi `emitJsonLd`. Phần trống bị ẩn; cả hai trống → không render.
 * Nội dung riêng từng màn, dùng lại được cho BL-054. Server Component (chỉ nút video là client).
 */
export function LearnMoreFaq({ learnMore, faqs = [], emitJsonLd = false, className }: LearnMoreFaqProps) {
  const t = useTranslations("page.listing.learnMore");
  const faqTitleId = useId();
  const locale = useLocale() as Locale;
  const hasLearnMore = Boolean(learnMore?.title.trim());
  const hasFaqs = faqs.length > 0;
  if (!hasLearnMore && !hasFaqs) return null;
  const jsonLd = emitJsonLd && hasFaqs ? buildFaqPageJsonLd({ locale, items: [...faqs] }) : null;

  return (
    <div className={cn("grid gap-8 lg:gap-10", hasLearnMore && hasFaqs && "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]", className)}>
      {hasLearnMore && learnMore && <LearnMoreCard content={learnMore} />}
      {hasFaqs && (
        <section aria-labelledby={faqTitleId} className="flex min-w-0 flex-col gap-4">
          <h2 id={faqTitleId} className="font-display text-h3 text-text">
            {t("faqTitle")}
          </h2>
          <div className="flex flex-col divide-y divide-border border-y border-border">
            {faqs.map((faq, index) => (
              <details key={`${index}-${faq.question}`} className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-small font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 break-words">{faq.question}</span>
                  <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-text">
                    <CaretDown size={14} className="transition-transform duration-(--duration-fast) group-open:rotate-180 motion-reduce:transition-none" />
                  </span>
                </summary>
                <p className="pb-4 text-small whitespace-pre-line text-text-secondary break-words">{faq.answer}</p>
              </details>
            ))}
          </div>
          {jsonLd && <JsonLd data={jsonLd} />}
        </section>
      )}
    </div>
  );
}

function LearnMoreCard({ content }: { content: LearnMoreContent }) {
  const titleId = useId();
  const video = content.videoUrl && parseVideoUrl(content.videoUrl) ? content.videoUrl : null;
  const showMedia = Boolean(content.image || video);
  const cta = content.cta?.label.trim() && content.cta.href.trim() ? content.cta : null;
  const ctaClass = cn(buttonVariants({ variant: "primary" }), "self-start");
  return (
    <section aria-labelledby={titleId} className={cn("grid min-w-0 overflow-hidden rounded-[20px] bg-bg-alt", showMedia && "md:grid-cols-2")}>
      {showMedia && (
        <div className="relative min-h-60 bg-dark-deep md:min-h-full">
          {content.image && <ResponsiveImage media={content.image} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw" decorative className="absolute inset-0" />}
          {video && <LearnMoreVideoButton url={video} title={content.title} />}
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-3 p-6 md:p-8">
        {content.eyebrow && <p className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{content.eyebrow}</p>}
        <h2 id={titleId} className="font-display text-h3 text-balance text-text">
          {content.title}
          {content.titleAccent && <span className="block text-accent-text">{content.titleAccent}</span>}
        </h2>
        {content.description && <p className="text-small whitespace-pre-line text-text-secondary">{content.description}</p>}
        {cta &&
          (isExternal(cta.href) ? (
            <a href={cta.href} rel="noopener" className={ctaClass}>
              {cta.label}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          ) : (
            <Link href={cta.href} className={ctaClass}>
              {cta.label}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
      </div>
    </section>
  );
}
