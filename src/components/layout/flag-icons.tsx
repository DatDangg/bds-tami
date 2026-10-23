import type { Locale } from "@/i18n/routing";

/**
 * Cờ chữ nhật 3:2 SVG inline cho nút đổi ngôn ngữ (BL-063 → BL-074, design-spec §2.3). Tự vẽ vì Phosphor không có quốc kỳ; không emoji
 * (hiển thị khác nhau giữa OS), không ảnh ngoài. Màu là màu quốc kỳ cố định, KHÔNG theo token/dark mode.
 * Trang trí thuần: `aria-hidden` + `focusable="false"` — tên truy cập nằm ở `aria-label` của link bao ngoài.
 * `data-flag` để test tra đúng cờ theo locale.
 */
export function FlagIcon({ locale, className }: { locale: Locale; className?: string }) {
  const shared = { viewBox: "0 0 30 20", "aria-hidden": true, focusable: "false", "data-flag": locale, className } as const;
  if (locale === "vi") {
    return (
      <svg {...shared}>
        <rect width="30" height="20" fill="#DA251D" />
        <polygon points={STAR_POINTS} fill="#FFFF00" />
      </svg>
    );
  }
  // Union Jack giản lược cho ô ~21×14px: chéo đỏ nằm giữa chéo trắng (không lệch pha/counterchange như cờ thật — không thấy được ở cỡ này).
  return (
    <svg {...shared}>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M15 0V20M0 10H30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M15 0V20M0 10H30" stroke="#C8102E" strokeWidth="3.4" />
    </svg>
  );
}

// Sao 5 cánh tâm (15,10) theo quy định quốc kỳ: đường tròn ngoại tiếp đường kính 2/3 chiều rộng → bán kính ngoài 20/3 ≈ 6.67,
// bán kính trong ≈ 0.382 × ngoài, đỉnh hướng lên; toạ độ tính sẵn (làm tròn 2 chữ số).
const STAR_POINTS = "15,3.33 16.5,7.94 21.34,7.94 17.42,10.79 18.92,15.39 15,12.55 11.08,15.39 12.58,10.79 8.66,7.94 13.5,7.94";
