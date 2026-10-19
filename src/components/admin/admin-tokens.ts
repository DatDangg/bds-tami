// Design tokens giao diện admin (BL-015, design docs/specs/2026-10-19-admin-ui-saas-design.md §1).
// Một nguồn giá trị: SCSS ở src/components/admin/styles/_tokens.scss ghi CÙNG giá trị (test admin-tokens.test.ts
// đọc file SCSS so từng token và tính contrast WCAG để số liệu không trôi).

export type AdminTheme = "light" | "dark";

/** Màu nền/chữ/viền/nhấn (§1.1 sáng, §1.2 tối). Khoá = tên biến CSS `--admin-<khoá>`. */
export const ADMIN_COLORS = {
  light: {
    canvas: "#F7F7F5",
    surface: "#FFFFFF",
    "surface-hover": "#FAF9F7",
    "nav-bg": "#FBFBFA",
    border: "#E7E5E4",
    "border-strong": "#8F8984",
    text: "#1C1917",
    "text-muted": "#57534E",
    "text-subtle": "#6B6560",
    accent: "#8C6733",
    "accent-hover": "#7A5A2C",
    "accent-soft": "#F8F3EB",
    "accent-soft-text": "#6A4E26",
    "on-accent": "#FFFFFF",
    focus: "#8C6733",
  },
  dark: {
    canvas: "#121110",
    surface: "#1A1918",
    "surface-hover": "#222120",
    "nav-bg": "#161514",
    border: "#2E2C2A",
    "border-strong": "#6E6862",
    text: "#F5F5F4",
    "text-muted": "#A8A29E",
    "text-subtle": "#8F8984",
    accent: "#E0BF89",
    "accent-hover": "#EBD2A8",
    "accent-soft": "#2A2013",
    "accent-soft-text": "#EBD2A8",
    "on-accent": "#141414",
    focus: "#E0BF89",
  },
} as const satisfies Record<AdminTheme, Record<string, string>>;

export type AdminColorToken = keyof (typeof ADMIN_COLORS)["light"];

export const BADGE_TONE_NAMES = ["neutral", "success", "warning", "danger", "info", "accent"] as const;
export type BadgeTone = (typeof BADGE_TONE_NAMES)[number];

/** Badge trạng thái (§1.3): chữ (fg) / nền (bg). CSS: `--admin-badge-<tone>-fg|bg`. */
export const BADGE_TONES: Record<AdminTheme, Record<BadgeTone, { fg: string; bg: string }>> = {
  light: {
    neutral: { fg: "#44403C", bg: "#F0EFED" },
    success: { fg: "#166534", bg: "#E7F5EC" },
    warning: { fg: "#854D0E", bg: "#FDF3DC" },
    danger: { fg: "#9F1239", bg: "#FDECEF" },
    info: { fg: "#1E4E8C", bg: "#E8F0FB" },
    accent: { fg: "#6A4E26", bg: "#F8F3EB" },
  },
  dark: {
    neutral: { fg: "#D6D3D1", bg: "#2E2C2A" },
    success: { fg: "#86EFAC", bg: "#12301E" },
    warning: { fg: "#FCD34D", bg: "#3A2A08" },
    danger: { fg: "#FDA4AF", bg: "#3B1219" },
    info: { fg: "#93C5FD", bg: "#132A4A" },
    accent: { fg: "#EBD2A8", bg: "#2A2013" },
  },
};

export const ELEVATION_STEPS = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000] as const;
export type ElevationStep = (typeof ELEVATION_STEPS)[number];

/**
 * Map thang `--theme-elevation-*` của Payload sang xám ấm (§1.6.1). Payload dùng bậc 400/500 làm màu chữ phụ
 * (mô tả field, header cột, placeholder) và 150 làm viền → bậc ≥ 400 phải ≥ 4.5:1 trên 0/50/100, bậc 350 ≥ 3:1.
 * Các bậc lẻ (550, 650, …) nội suy giữa hai bậc design cho sẵn.
 */
export const ADMIN_ELEVATION: Record<AdminTheme, Record<ElevationStep, string>> = {
  light: {
    0: "#FFFFFF",
    50: "#F7F7F5",
    100: "#EFEEEC",
    150: "#E7E5E4",
    200: "#D6D3D1",
    250: "#C4C0BC",
    300: "#A8A29E",
    350: "#8F8984",
    400: "#6E6862",
    450: "#625C57",
    500: "#57534E",
    550: "#4D4945",
    600: "#44403C",
    650: "#3B3835",
    700: "#332F2D",
    750: "#2E2A28",
    800: "#292524",
    850: "#1F1C1A",
    900: "#1C1917",
    950: "#141210",
    1000: "#0C0A09",
  },
  dark: {
    0: "#1A1918",
    50: "#222120",
    100: "#292524",
    150: "#36322F",
    200: "#44403C",
    250: "#4A4642",
    300: "#57534E",
    350: "#6E6862",
    400: "#A8A29E",
    450: "#B0ABA6",
    500: "#C4C0BC",
    550: "#CFCBC7",
    600: "#D6D3D1",
    650: "#DDDAD7",
    700: "#E3E0DD",
    750: "#E9E7E4",
    800: "#EFEEEC",
    850: "#F3F2F0",
    900: "#F7F7F5",
    950: "#FBFBFA",
    1000: "#FFFFFF",
  },
};

/** Bậc elevation Payload dùng làm màu chữ (field-description, thead, status label, placeholder, read-only). */
export const ELEVATION_TEXT_STEPS: readonly ElevationStep[] = [400, 450, 500, 600, 800, 1000];
/** Bậc elevation dùng làm nền chữ (theme-bg, hàng lẻ bảng, read-only input). */
export const ELEVATION_SURFACE_STEPS: readonly ElevationStep[] = [0, 50, 100];

/** Bo góc (§1.4) — map `--style-radius-s/m/l` của Payload. */
export const ADMIN_RADIUS = { s: "6px", m: "8px", l: "12px" } as const;

/** Bóng (§1.4): chỉ giao diện sáng; tối dùng viền thay bóng. */
export const ADMIN_SHADOW = {
  light: { sm: "0 1px 2px rgba(28, 25, 23, 0.06)", md: "0 1px 3px rgba(28, 25, 23, 0.08), 0 8px 24px rgba(28, 25, 23, 0.06)" },
  dark: { sm: "none", md: "none" },
} as const;
