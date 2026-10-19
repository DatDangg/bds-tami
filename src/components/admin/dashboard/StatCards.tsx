import Link from "next/link";
import type { StatCard } from "./dashboard-data";
import { StatusBadge } from "../StatusBadge";
import { DashboardIcon } from "./DashboardIcons";

function StatCardBody({ card }: { card: StatCard }) {
  return (
    <>
      <span className="tami-dash-stat__label">
        <span className="tami-dash-stat__icon">
          <DashboardIcon name={card.icon} />
        </span>
        {card.label}
      </span>
      <span className="tami-dash-stat__value">
        {card.count.toLocaleString("vi-VN")}
        {card.warnWhenPositive && card.count > 0 && <StatusBadge value="needs-assignment" tone="warning" label="Cần giao" />}
      </span>
      <span className="tami-dash-stat__hint">{card.hint}</span>
    </>
  );
}

/** Thẻ đã được lọc theo quyền ở `loadStatCards`; thẻ đếm đúng 1 collection là link tới danh sách lọc sẵn, thẻ gộp nhiều loại thì không. */
export function StatCards({ cards }: { cards: StatCard[] }) {
  if (cards.length === 0) return null;
  return (
    <ul className="tami-dash-stats" aria-label="Số liệu nhanh">
      {cards.map((card) => (
        <li key={card.id}>
          {card.href ? (
            <Link className="tami-dash-stat" href={card.href} prefetch={false}>
              <StatCardBody card={card} />
            </Link>
          ) : (
            <div className="tami-dash-stat">
              <StatCardBody card={card} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
