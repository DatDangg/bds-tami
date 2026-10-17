import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import type { ShellView } from "./shell-data";
import { SkipLink } from "./SkipLink";

/**
 * Khung mọi trang công khai: skip link (focus đầu tiên) → `header` → `main#main` → `footer`.
 * `main` có `tabIndex={-1}` để skip link chuyển focus vào nội dung; outline bỏ vì main không phải điều khiển tương tác.
 */
export function PublicShell({ shell, children }: { shell: ShellView; children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <Header items={shell.navItems} contact={shell.contact} />
      <main id="main" tabIndex={-1} className="min-h-[60dvh] focus:outline-none">
        {children}
      </main>
      <Footer {...shell.footer} contact={shell.contact} />
    </>
  );
}
