import { EB_Garamond, Montserrat } from "next/font/google";

// Tự host qua next/font (tokens §2): subset vietnamese, display swap, chỉ tải weight dùng.
// Biến CSS --font-eb-garamond / --font-montserrat được globals.css (@theme) trỏ vào --font-display / --font-sans.
export const ebGaramond = EB_Garamond({
  subsets: ["latin", "vietnamese"],
  // 400 = heading mặc định (BL-020); 500 giữ cho tiêu đề thẻ tin nổi bật PostCard (font-semibold + font-display, tránh bold giả).
  weight: ["400", "500"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});
