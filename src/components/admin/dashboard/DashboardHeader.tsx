import { formatToday, greetingFor } from "./dashboard-format";
import type { Shortcut } from "./dashboard-data";
import { DashboardIcon } from "./DashboardIcons";

interface DashboardHeaderProps {
  name: string;
  now: Date;
  shortcuts: Shortcut[];
}

/**
 * Lời chào + ngày + nút "Tạo mới". Menu dùng `<details>` (không cần JS, bàn phím/đọc màn hình sẵn có); chỉ liệt kê collection
 * user có quyền `create` — không có quyền nào thì không render nút.
 */
export function DashboardHeader({ name, now, shortcuts }: DashboardHeaderProps) {
  return (
    <header className="tami-dash__header">
      <div>
        <h1 className="tami-dash__title">
          {greetingFor(now)}, {name}
        </h1>
        <p className="tami-dash__date">{formatToday(now)}</p>
      </div>
      {shortcuts.length > 0 && (
        <details className="tami-dash-create">
          <summary className="tami-dash-create__button">
            <DashboardIcon name="plus" />
            Tạo mới
          </summary>
          <ul className="tami-dash-create__menu" aria-label="Tạo nhanh">
            {shortcuts.map((shortcut) => (
              <li key={shortcut.slug}>
                <a href={shortcut.href}>{shortcut.label}</a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </header>
  );
}
