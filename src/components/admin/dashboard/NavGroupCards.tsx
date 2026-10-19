import Link from "next/link";
import type { NavGroupCard } from "./dashboard-data";

/** "Danh mục quản lý": cùng nhóm với sidebar; mục không đủ quyền/bị ẩn đã loại ở `buildNavGroupCards`. */
export function NavGroupCards({ groups }: { groups: NavGroupCard[] }) {
  if (groups.length === 0) return null;
  return (
    <section aria-labelledby="tami-dash-groups">
      <h2 id="tami-dash-groups" className="tami-dash__section-title">
        Danh mục quản lý
      </h2>
      <div className="tami-dash-groups">
        {groups.map((group) => (
          <nav key={group.label} className="tami-dash-card tami-dash-group" aria-label={group.label}>
            <h3 className="tami-dash-group__title">{group.label}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} prefetch={false}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </section>
  );
}
