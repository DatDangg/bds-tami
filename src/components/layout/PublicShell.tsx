import type { ReactNode } from "react";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { UtmCapture } from "@/components/leads/UtmCapture";
import { isValidGaMeasurementId } from "@/lib/consent/consent-cookie";
import { FloatingContact } from "./FloatingContact";
import { Footer } from "./Footer";
import { Header } from "./Header";
import type { ShellView } from "./shell-data";
import { SkipLink } from "./SkipLink";

/**
 * Khung mọi trang công khai: skip link (focus đầu tiên) → `header` → `main#main` → `footer` → nút nổi → banner cookie (cuối DOM nên đứng sau nội dung chính trong thứ tự focus).
 * `main` có `tabIndex={-1}` để skip link chuyển focus vào nội dung; outline bỏ vì main không phải điều khiển tương tác.
 * `UtmCapture` không render gì — chỉ lưu `utm_*` của URL cho lead (BR-10) ở mọi trang.
 */
export function PublicShell({ shell, children }: { shell: ShellView; children: ReactNode }) {
  return (
    <>
      <UtmCapture />
      <SkipLink />
      <Header items={shell.navItems} contact={shell.contact} logo={shell.logo} cta={shell.cta} />
      <main id="main" tabIndex={-1} className="min-h-[60dvh] focus:outline-none">
        {children}
      </main>
      <Footer
        {...shell.footer}
        logo={shell.logo}
        contact={shell.contact}
        showCookieSettings={isValidGaMeasurementId(shell.consent.gaMeasurementId)}
      />
      <FloatingContact contact={shell.floatingContact} />
      <CookieBanner {...shell.consent} />
    </>
  );
}
