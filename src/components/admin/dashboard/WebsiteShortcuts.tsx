import Link from "next/link";
import type { WebsiteShortcut } from "./dashboard-data";
import { DashboardIcon } from "./DashboardIcons";

/**
 * Mục "Sửa website" (BL-041, BL-051 A8): lưới thẻ điều hướng tới các phần giao diện công khai (icon + tên + chevron),
 * có tiêu đề mục — không giống tab/chip lọc. Chỉ admin — danh sách rỗng thì không render.
 */
export function WebsiteShortcuts({ shortcuts }: { shortcuts: WebsiteShortcut[] }) {
  if (shortcuts.length === 0) return null;
  return (
    <nav className="tami-dash-site" aria-label="Sửa website">
      <h2 className="tami-dash__section-title">Sửa website</h2>
      <ul className="tami-dash-site__grid">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.slug}>
            <Link href={shortcut.href} prefetch={false} className="tami-dash-site__card">
              <span className="tami-dash-site__icon">
                <DashboardIcon name="draft" />
              </span>
              <span className="tami-dash-site__name">{shortcut.label}</span>
              <span className="tami-dash-site__chevron">
                <DashboardIcon name="chevron" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
