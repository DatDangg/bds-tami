import type { StatIconName } from "./dashboard-queries";

/** Icon inline SVG (stroke theo `currentColor`) chỉ dùng ở dashboard — không thêm dependency (design Q4). */
const PATHS: Record<StatIconName | "plus", string> = {
  lead: "M16 11a4 4 0 1 0-8 0M4 20a8 8 0 0 1 16 0",
  alert: "M12 8v5M12 16.5v.5M10.3 3.9 2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  progress: "M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4",
  applicant: "M4 6h16v12H4zM4 7l8 6 8-6",
  draft: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z",
  visible: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  plus: "M12 5v14M5 12h14",
};

export function DashboardIcon({ name }: { name: StatIconName | "plus" }) {
  return (
    <svg className="tami-dash-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
