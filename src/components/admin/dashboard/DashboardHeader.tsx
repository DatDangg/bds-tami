import { formatToday, greetingFor } from "./dashboard-format";

interface DashboardHeaderProps {
  name: string;
  now: Date;
}

/** Lời chào + ngày. Thao tác tạo mới nằm ở hàng thẻ `QuickActions` ngay dưới. */
export function DashboardHeader({ name, now }: DashboardHeaderProps) {
  return (
    <header className="tami-dash__header">
      <h1 className="tami-dash__title">
        {greetingFor(now)}, {name}
      </h1>
      <p className="tami-dash__date">{formatToday(now)}</p>
    </header>
  );
}
