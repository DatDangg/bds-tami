"use client";

import { Link, useConfig } from "@payloadcms/ui";
import { usePathname } from "next/navigation";

const DASHBOARD_LABEL = "Tổng quan";

/**
 * Mục "Tổng quan" đầu sidebar admin (BL-050, FR-ADM-19): lối vào dashboard — Payload DefaultNav chỉ render nhóm collection/global.
 * Markup bám DefaultNavClient (nav__link + nav__link-indicator) để ăn style mục đang chọn của BL-041.
 */
export function NavDashboardLink() {
  const pathname = usePathname();
  const { config } = useConfig();
  const adminRoute = config.routes.admin;
  const isActive = pathname === adminRoute || pathname === `${adminRoute}/`;

  const label = (
    <>
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">{DASHBOARD_LABEL}</span>
    </>
  );

  return (
    <div className="tami-nav-dashboard">
      {isActive ? (
        <div className="nav__link" id="nav-dashboard">
          {label}
        </div>
      ) : (
        <Link className="nav__link" href={adminRoute} id="nav-dashboard" prefetch={false}>
          {label}
        </Link>
      )}
    </div>
  );
}
