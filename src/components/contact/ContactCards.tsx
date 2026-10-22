import { useTranslations } from "next-intl";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, ChatCircleDots, Clock, EnvelopeSimple, Phone } from "@/components/icons";
import type { ContactCardsView } from "@/lib/content/contact-view";
import { cn } from "@/lib/utils";

type CardIcon = ComponentType<{ size?: number; "aria-hidden"?: "true" }>;

// Số cột ≥ lg theo số thẻ đang có (thẻ thiếu dữ liệu bị bỏ, lưới co lại thay vì để ô trống).
const LG_COLUMNS = ["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"] as const;
const ACTION_CLASS = "inline-flex min-h-11 items-center gap-1.5 text-small font-semibold text-accent-text transition-colors hover:text-text lg:min-h-8";

function Card({ icon: Icon, label, value, children }: { icon: CardIcon; label: string; value: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-start gap-4 rounded-xl bg-surface p-5 shadow-md">
      {/* Ô tròn vàng nhạt như dải Điểm mạnh / design `lien-he`. */}
      <span aria-hidden="true" className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-text">
        <Icon size={24} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-small text-text-secondary">{label}</p>
        <p className="text-body font-semibold break-words text-text">{value}</p>
        {children}
      </div>
    </li>
  );
}

/**
 * 4 thẻ nổi đè mép dưới hero trang Liên hệ (BL-054, design `lien-he`): Hotline (`tel:`), Email (`mailto:`), Zalo OA (`siteName` → `zaloUrl`, tab mới),
 * Giờ làm việc (`workingHours`). Thẻ thiếu dữ liệu bị ẩn; lưới 1 cột (mobile) → 2×2 (sm–md) → N cột (≥ lg). Không thẻ nào → không render. Server Component.
 */
export function ContactCards({ cards }: { cards: ContactCardsView }) {
  const t = useTranslations("page.contact.v2");
  const { hotline, email, zalo, workingHours } = cards;
  const count = [hotline, email, zalo, workingHours].filter(Boolean).length;
  if (count === 0) return null;
  return (
    <ul aria-label={t("cardsLabel")} className={cn("grid gap-4 sm:grid-cols-2 lg:gap-5", LG_COLUMNS[count])}>
      {hotline && (
        <Card icon={Phone} label={t("hotline")} value={hotline.label}>
          <a href={hotline.telHref} aria-label={t("callNowAria", { number: hotline.label })} className={ACTION_CLASS}>
            {t("callNow")}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </Card>
      )}
      {email && (
        <Card icon={EnvelopeSimple} label={t("email")} value={email}>
          <a href={`mailto:${email}`} aria-label={t("sendEmailAria", { email })} className={ACTION_CLASS}>
            {t("sendEmail")}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </Card>
      )}
      {zalo && (
        <Card icon={ChatCircleDots} label={t("zalo")} value={zalo.name}>
          <a href={zalo.url} target="_blank" rel="noopener noreferrer" aria-label={t("zaloAria", { name: zalo.name })} className={ACTION_CLASS}>
            {t("zaloAction")}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </Card>
      )}
      {workingHours && (
        <Card icon={Clock} label={t("hours")} value={workingHours.hours}>
          {workingHours.days && <p className="text-small font-semibold text-accent-text">{workingHours.days}</p>}
        </Card>
      )}
    </ul>
  );
}
