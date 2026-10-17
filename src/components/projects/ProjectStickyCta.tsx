"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LEAD_FORM_DOM_ID } from "@/lib/projects/project-detail-view";

/** Cao 64px (design-spec S03) = `h-16` + vùng an toàn đáy (tai thỏ/thanh home). Nút liên hệ nổi cộng đúng chiều cao này vào `bottom` qua `--sticky-cta-height`. */
const BAR_HEIGHT_PX = 64;
const SAFE_AREA_BOTTOM = "env(safe-area-inset-bottom, 0px)";
const OFFSET_VAR = "--sticky-cta-height";
const LG_QUERY = "(min-width: 1024px)";

/**
 * Thanh "Nhận tư vấn" dính đáy (tuỳ biến `label` + `targetId` cho nút "Ứng tuyển" ở trang tuyển dụng) chỉ trên mobile (< lg; `lg:hidden` để HTML server không hiện ở desktop), hiện khi vùng form lead CHƯA trong viewport (design-spec S03). Đặt
 * `--sticky-cta-height` trên `<html>` khi đang hiện để nút liên hệ nổi nằm trên thanh (biến khác `--floating-bottom-offset` của banner cookie, để hai bên không ghi đè nhau);
 * thanh tự nằm trên banner cookie bằng chính `--floating-bottom-offset`. Không có IntersectionObserver thì thanh luôn hiện.
 */
export function ProjectStickyCta({ targetId = LEAD_FORM_DOM_ID, label }: { targetId?: string; label?: string } = {}) {
  const t = useTranslations("page.projectDetail");
  const [formInView, setFormInView] = useState(false);
  const [isLg, setIsLg] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(LG_QUERY);
    const update = () => setIsLg(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const form = document.getElementById(targetId);
    if (!form || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => setFormInView(entries.some((entry) => entry.isIntersecting)));
    observer.observe(form);
    return () => observer.disconnect();
  }, [targetId]);

  const visible = !isLg && !formInView;
  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    root.style.setProperty(OFFSET_VAR, `calc(${BAR_HEIGHT_PX}px + ${SAFE_AREA_BOTTOM})`);
    return () => {
      root.style.removeProperty(OFFSET_VAR);
    };
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-[var(--floating-bottom-offset,0px)] z-(--z-sticky) box-content flex h-16 items-center bg-surface px-gutter pb-[env(safe-area-inset-bottom,0px)] shadow-md lg:hidden print:hidden">
      <Button asChild size="lg" className="w-full">
        <a href={`#${targetId}`}>{label ?? t("stickyConsult")}</a>
      </Button>
    </div>
  );
}
