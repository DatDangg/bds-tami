import { Gutter } from "@payloadcms/ui";

import { TranslationFailedBanner } from "../TranslationFailedBanner";
import { type DashboardContext, loadDashboardData } from "./dashboard-data";
import { DashboardHeader } from "./DashboardHeader";
import { QuickActions } from "./QuickActions";
import { RecentLeadsCard, RecentOwnDocsCard } from "./RecentLists";
import { StatCards } from "./StatCards";
import { WebsiteShortcuts } from "./WebsiteShortcuts";

/**
 * Màn Tổng quan (`admin.components.views.dashboard`, BL-015 T04, FR-ADM-19). Server Component: số liệu lấy bằng Local API
 * `overrideAccess:false` theo người đăng nhập, chỉ truy vấn/hiển thị phần user có quyền (không ẩn bằng CSS).
 * Thay view mặc định nên `beforeDashboard` không còn chạy: banner dịch lỗi được render trực tiếp ở đây.
 * Bố cục (BL-041): chào → thao tác nhanh → Sửa website (admin) → banner dịch lỗi → thẻ đếm → lead/bài gần đây.
 * Khối thống kê sâu của FR-ADM-14 (L13-T01) cắm thêm vào đây, không đổi khung.
 */
export async function DashboardView(props: DashboardContext) {
  const data = await loadDashboardData(props);
  const now = new Date();
  const isAdmin = props.user.role === "admin";
  const adminRoute = props.payload.config.routes.admin;
  const name = props.user.fullName?.trim() || props.user.email || "bạn";

  return (
    <Gutter className="tami-dash">
      <DashboardHeader name={name} now={now} />
      <QuickActions actions={data.quickActions} moreShortcuts={data.moreShortcuts} />
      <WebsiteShortcuts shortcuts={data.websiteShortcuts} />
      <TranslationFailedBanner />
      <StatCards cards={data.stats} />
      {(data.recentLeads || data.recentOwnDocs) && (
        <div className="tami-dash-two">
          {data.recentLeads && <RecentLeadsCard leads={data.recentLeads} now={now} isAdmin={isAdmin} adminRoute={adminRoute} />}
          {data.recentOwnDocs && <RecentOwnDocsCard docs={data.recentOwnDocs} now={now} />}
        </div>
      )}
    </Gutter>
  );
}
