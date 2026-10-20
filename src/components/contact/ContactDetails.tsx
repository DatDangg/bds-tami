import { useTranslations } from "next-intl";
import type { ComponentType, ReactNode } from "react";
import { Clock, EnvelopeSimple, MapPin, Phone } from "@/components/icons";
import { SocialLinks } from "@/components/layout/Footer";
import type { FooterContactView, SocialLinkView } from "@/components/layout/shell-data";

interface ContactDetailsProps {
  contact: FooterContactView;
  socials: SocialLinkView[];
}

const LINK_CLASS = "inline-flex min-h-11 items-center break-all text-body text-text-secondary transition-colors hover:text-accent-text";

function ContactRow({ icon: Icon, label, children }: { icon: ComponentType<{ size?: number; "aria-hidden"?: "true" }>; label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      {/* Ô tròn vàng nhạt giống dải Điểm mạnh (mockup `.cinfo .round.gold`). */}
      <span aria-hidden="true" className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-text">
        <Icon size={22} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col">
        <p className="font-semibold">{label}</p>
        {children}
      </div>
    </li>
  );
}

/**
 * Cột thông tin liên hệ của S15 (mockup `.cinfo`, BL-045): danh sách icon tròn + nhãn + giá trị (địa chỉ, hotline gọi được `tel:`, email `mailto:`, giờ làm việc), rồi mạng xã hội.
 * Trường admin chưa nhập thì ẩn; giờ làm việc lấy từ i18n (Spec § Quy tắc biên) nên luôn hiện. Đầu khối ("Văn phòng TAMI") do trang dựng bằng `SectionHeading`. Server Component.
 */
export function ContactDetails({ contact, socials }: ContactDetailsProps) {
  const t = useTranslations("page.contact");
  const tFooter = useTranslations("layout.footer");
  const { hotline, email, address } = contact;
  return (
    <div className="flex flex-col gap-8">
      <ul className="flex flex-col gap-5">
        {address && (
          <ContactRow icon={MapPin} label={t("address")}>
            <p className="text-body text-text-secondary">{address}</p>
          </ContactRow>
        )}
        {hotline && (
          <ContactRow icon={Phone} label={t("hotline")}>
            <a href={hotline.telHref} aria-label={`${t("hotline")}: ${hotline.label}`} className={LINK_CLASS}>
              {hotline.label}
            </a>
          </ContactRow>
        )}
        {email && (
          <ContactRow icon={EnvelopeSimple} label={t("email")}>
            <a href={`mailto:${email}`} className={LINK_CLASS}>
              {email}
            </a>
          </ContactRow>
        )}
        <ContactRow icon={Clock} label={t("hours")}>
          <p className="text-body text-text-secondary">{t("hoursValue")}</p>
        </ContactRow>
      </ul>
      {socials.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xsmall font-semibold tracking-[0.08em] text-text-muted uppercase">{tFooter("social")}</p>
          <SocialLinks socials={socials} />
        </div>
      )}
    </div>
  );
}
