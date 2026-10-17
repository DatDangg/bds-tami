import { notFound } from "next/navigation";

/**
 * Bắt mọi URL không khớp route nào trong nhánh ngôn ngữ để rơi vào `[locale]/not-found.tsx` (đúng ngôn ngữ, đủ
 * header/footer). Không có file này, Next dùng 404 gốc không có layout/ngôn ngữ cho `/en/khong-ton-tai`.
 */
export default function UnmatchedPage(): never {
  notFound();
}
