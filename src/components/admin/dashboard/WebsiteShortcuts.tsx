import Link from "next/link";
import type { WebsiteShortcut } from "./dashboard-data";

/** Hàng "Sửa website" (BL-041): lối tắt tới các phần giao diện công khai. Chỉ admin — danh sách rỗng thì không render. */
export function WebsiteShortcuts({ shortcuts }: { shortcuts: WebsiteShortcut[] }) {
  if (shortcuts.length === 0) return null;
  return (
    <nav className="tami-dash-site" aria-label="Sửa website">
      <span className="tami-dash-site__title">Sửa website</span>
      <ul>
        {shortcuts.map((shortcut) => (
          <li key={shortcut.slug}>
            <Link href={shortcut.href} prefetch={false}>{shortcut.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
