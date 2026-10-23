import type { ReactNode } from "react";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { HomeAnnouncementBar } from "@/components/home/HomeAnnouncementBar";
import { ConsultPopup } from "@/components/leads/ConsultPopup";
import { UtmCapture } from "@/components/leads/UtmCapture";
import { isValidGaMeasurementId } from "@/lib/consent/consent-cookie";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import { BackToTop } from "./BackToTop";
import { FloatingContact } from "./FloatingContact";
import { FloatingDock } from "./FloatingDock";
import { Footer } from "./Footer";
import { Header } from "./Header";
import type { ShellView } from "./shell-data";
import { SkipLink } from "./SkipLink";

/**
 * Khung mọi trang công khai: skip link (focus đầu tiên) → `header` → `main#main` → `footer` → nút nổi → banner cookie (cuối DOM nên đứng sau nội dung chính trong thứ tự focus).
 * `main` có `tabIndex={-1}` để skip link chuyển focus vào nội dung; outline bỏ vì main không phải điều khiển tương tác.
 * Thanh thông báo (`shell.announcement`, chỉ hiện ở trang chủ: `HomeAnnouncementBar` tự kiểm đường dẫn) đứng TRÊN `header` trong luồng, sau skip link; header dính vẫn bám mép trên khi cuộn qua thanh.
 * `ConsultPopup` (BL-066) tự mở form tư vấn sau 30s ở mọi trang trừ Liên hệ; site key đọc ở đây (server, lúc dựng trang) như trang Liên hệ.
 * `UtmCapture` không render gì — chỉ lưu `utm_*` của URL cho lead (BR-10) ở mọi trang.
 */
export function PublicShell({ shell, children }: { shell: ShellView; children: ReactNode }) {
  const turnstileSiteKey = readTurnstileSiteKey();
  return (
    <>
      <UtmCapture />
      <SkipLink />
      {shell.announcement && <HomeAnnouncementBar announcement={shell.announcement} />}
      <Header items={shell.navItems} contact={shell.contact} logo={shell.logo} cta={shell.cta} />
      <main id="main" tabIndex={-1} className="min-h-[60dvh] focus:outline-none">
        {children}
      </main>
      <Footer
        {...shell.footer}
        logo={shell.logo}
        showCookieSettings={isValidGaMeasurementId(shell.consent.gaMeasurementId)}
      />
      <FloatingDock>
        <BackToTop />
        <FloatingContact contact={shell.floatingContact} />
      </FloatingDock>
      <CookieBanner {...shell.consent} />
      <ConsultPopup {...(turnstileSiteKey ? { turnstileSiteKey } : {})} {...(shell.contact.hotline ? { hotline: shell.contact.hotline } : {})} />
    </>
  );
}
