import Link from "next/link";
import type { QuickAction, Shortcut } from "./dashboard-data";
import { DashboardIcon } from "./DashboardIcons";

interface QuickActionsProps {
  actions: QuickAction[];
  moreShortcuts: Shortcut[];
}

/**
 * Hàng thẻ thao tác nhanh (BL-041): việc hay làm nhất, bấm một lần. Loại nội dung còn lại ("Tạo loại khác") nằm trong
 * `<details>` dạng thẻ cùng tỉ lệ các thẻ cùng hàng (không cần JS, bàn phím/đọc màn hình sẵn có). Thẻ/mục không đủ quyền đã bị loại ở `dashboard-data`.
 */
export function QuickActions({ actions, moreShortcuts }: QuickActionsProps) {
  if (actions.length === 0 && moreShortcuts.length === 0) return null;
  return (
    <section className="tami-dash-actions" aria-label="Thao tác nhanh">
      {actions.map((action) => (
        <Link key={action.id} href={action.href} prefetch={false} className="tami-dash-action">
          <span className="tami-dash-action__icon">
            <DashboardIcon name={action.icon} />
          </span>
          {action.label}
        </Link>
      ))}
      {moreShortcuts.length > 0 && (
        <details className="tami-dash-create">
          <summary className="tami-dash-create__button">
            <span className="tami-dash-action__icon">
              <DashboardIcon name="plus" />
            </span>
            <span className="tami-dash-create__label">Tạo loại khác</span>
            <span className="tami-dash-create__chevron">
              <DashboardIcon name="chevron" />
            </span>
          </summary>
          <ul className="tami-dash-create__menu" aria-label="Tạo loại khác">
            {moreShortcuts.map((shortcut) => (
              <li key={shortcut.slug}>
                <Link href={shortcut.href} prefetch={false}>{shortcut.label}</Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
