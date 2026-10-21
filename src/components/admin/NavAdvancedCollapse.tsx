"use client";

import { usePreferences } from "@payloadcms/ui";
import { useEffect, type ReactNode } from "react";

import { ADVANCED_NAV_GROUP_LABEL } from "./admin-groups";

const NAV_PREFERENCE_KEY = "nav";
const WAIT_FOR_NAV_MS = 5000;

type NavPreference = { groups?: Record<string, { open?: boolean } | undefined> } | null | undefined;

/** Người dùng chưa từng mở/đóng nhóm "Nâng cao" thì mới thu gọn mặc định. */
export function shouldCollapseAdvancedGroup(navPreference: NavPreference): boolean {
  return navPreference?.groups?.[ADVANCED_NAV_GROUP_LABEL] === undefined;
}

// Phụ thuộc markup nội bộ của Payload 3.91 (NavGroup: id `nav-group-<label>`, class `nav-group__toggle--open`).
// Nâng cấp Payload có thể làm hỏng selector này: hậu quả chỉ là nhóm giữ nguyên trạng thái mở, không lỗi — kiểm lại khi nâng cấp.
function findOpenAdvancedToggle(): HTMLButtonElement | null {
  const group = document.getElementById(`nav-group-${ADVANCED_NAV_GROUP_LABEL}`);
  return group?.querySelector<HTMLButtonElement>("button.nav-group__toggle--open") ?? null;
}

/** Chờ nav render (Nav là server component stream) rồi gọi `callback` với nút toggle; hết hạn thì thôi. */
function whenToggleAppears(callback: (toggle: HTMLButtonElement) => void): () => void {
  const existing = findOpenAdvancedToggle();
  if (existing) {
    callback(existing);
    return () => {};
  }
  const observer = new MutationObserver(() => {
    const toggle = findOpenAdvancedToggle();
    if (!toggle) return;
    observer.disconnect();
    callback(toggle);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  const timer = window.setTimeout(() => observer.disconnect(), WAIT_FOR_NAV_MS);
  return () => {
    observer.disconnect();
    window.clearTimeout(timer);
  };
}

/**
 * Provider admin (BL-041, D3): Payload 3.91 mở mọi nhóm menu khi chưa có preference. Lần đầu (chưa có preference nhóm
 * "Nâng cao") bấm nút toggle của chính Payload để thu gọn — Payload tự lưu `open:false`, lần sau tôn trọng lựa chọn người dùng.
 */
export function NavAdvancedCollapse({ children }: { children?: ReactNode }) {
  const { getPreference } = usePreferences();
  useEffect(() => {
    let cancelled = false;
    // Chỉ bấm khi preference vẫn chưa có và nhóm vẫn đang mở (người dùng có thể vừa tự mở/đóng trong lúc chờ nav render).
    const collapseIfStillDefault = async (toggle: HTMLButtonElement) => {
      try {
        const latest = await getPreference<NavPreference>(NAV_PREFERENCE_KEY);
        if (shouldCollapseAdvancedGroup(latest) && toggle.isConnected && toggle.classList.contains("nav-group__toggle--open")) toggle.click();
      } catch {
        // Lỗi đọc preference: giữ nguyên trạng thái hiện tại.
      }
    };
    let stopWaiting = () => {};
    getPreference<NavPreference>(NAV_PREFERENCE_KEY)
      .then((navPreference) => {
        if (cancelled || !shouldCollapseAdvancedGroup(navPreference)) return;
        stopWaiting = whenToggleAppears((toggle) => void collapseIfStillDefault(toggle));
      })
      .catch(() => {
        // Chưa đăng nhập / lỗi mạng: giữ hành vi mặc định của Payload (nhóm mở).
      });
    return () => {
      cancelled = true;
      stopWaiting();
    };
  }, [getPreference]);

  return children;
}
