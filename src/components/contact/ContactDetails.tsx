import { useTranslations } from "next-intl";
import { Phone } from "@/components/icons";
import { SocialLinks } from "@/components/layout/Footer";
import type { FooterContactView, SocialLinkView } from "@/components/layout/shell-data";

interface ContactDetailsProps {
  contact: FooterContactView;
  socials: SocialLinkView[];
}

const LABEL_CLASS = "text-xsmall font-semibold tracking-[0.08em] text-text-muted uppercase";

/**
 * Cột thông tin liên hệ của S15 (design-spec): hotline là nút lớn gọi được (`tel:`, full-width ở 375), email/địa chỉ/giờ làm việc
 * dạng `<dl>`, mạng xã hội. Trường admin chưa nhập thì ẩn; giờ làm việc lấy từ i18n (Spec § Quy tắc biên) nên luôn hiện.
 * Server Component.
 */
export function ContactDetails({ contact, socials }: ContactDetailsProps) {
  const t = useTranslations("page.contact");
  const tFooter = useTranslations("layout.footer");
  const { hotline, email, address } = contact;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-h2-sm">{t("infoTitle")}</h2>
      {hotline && (
        <div className="flex flex-col gap-2">
          <p className={LABEL_CLASS}>{t("hotline")}</p>
          <a
            href={hotline.telHref}
            aria-label={`${t("hotline")}: ${hotline.label}`}
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-sm bg-primary px-6 text-h3 font-semibold text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary-hover lg:w-fit lg:justify-start"
          >
            <Phone size={28} weight="fill" aria-hidden="true" />
            {hotline.label}
          </a>
        </div>
      )}
      <dl className="flex flex-col gap-4">
        {email && (
          <div className="flex flex-col gap-1">
            <dt className={LABEL_CLASS}>{t("email")}</dt>
            <dd>
              <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center text-body break-all underline underline-offset-4 hover:text-accent-text">
                {email}
              </a>
            </dd>
          </div>
        )}
        {address && (
          <div className="flex flex-col gap-1">
            <dt className={LABEL_CLASS}>{t("address")}</dt>
            <dd className="text-body">{address}</dd>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <dt className={LABEL_CLASS}>{t("hours")}</dt>
          <dd className="text-body">{t("hoursValue")}</dd>
        </div>
      </dl>
      {socials.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className={LABEL_CLASS}>{tFooter("social")}</p>
          <SocialLinks socials={socials} />
        </div>
      )}
    </div>
  );
}
