import type { Locale } from "@/i18n/routing";

/**
 * Cờ vuông SVG inline cho nút đổi ngôn ngữ (BL-063, design-spec §2.3). Tự vẽ vì Phosphor không có quốc kỳ; không emoji
 * (hiển thị khác nhau giữa OS), không ảnh ngoài. Màu là màu quốc kỳ cố định, KHÔNG theo token/dark mode.
 * Trang trí thuần: `aria-hidden` + `focusable="false"` — tên truy cập nằm ở `aria-label` của link bao ngoài.
 * `data-flag` để test tra đúng cờ theo locale.
 */
export function FlagIcon({ locale, className }: { locale: Locale; className?: string }) {
  const shared = { viewBox: "0 0 24 24", "aria-hidden": true, focusable: "false", "data-flag": locale, className } as const;
  if (locale === "vi") {
    return (
      <svg {...shared}>
        <rect width="24" height="24" fill="#DA251D" />
        <polygon points={STAR_POINTS} fill="#FFFF00" />
      </svg>
    );
  }
  // Union Jack giản lược cho ô 24px: chéo đỏ nằm giữa chéo trắng (không lệch pha/counterchange như cờ thật — không thấy được ở cỡ này).
  return (
    <svg {...shared}>
      <rect width="24" height="24" fill="#012169" />
      <path d="M0 0L24 24M24 0L0 24" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M0 0L24 24M24 0L0 24" stroke="#C8102E" strokeWidth="2" />
      <path d="M12 0V24M0 12H24" stroke="#FFFFFF" strokeWidth="7" />
      <path d="M12 0V24M0 12H24" stroke="#C8102E" strokeWidth="4" />
    </svg>
  );
}

// Sao 5 cánh tâm (12,12), bán kính ngoài 6.5 / trong 2.5, đỉnh hướng lên; toạ độ tính sẵn (làm tròn 2 chữ số).
const STAR_POINTS = "12,5.5 13.47,9.98 18.18,9.99 14.38,12.77 15.82,17.26 12,14.5 8.18,17.26 9.62,12.77 5.82,9.99 10.53,9.98";
