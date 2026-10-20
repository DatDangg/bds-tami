import { Montserrat } from "next/font/google";

// Tự host qua next/font (tokens §2): subset vietnamese, display swap, chỉ tải weight dùng.
// Một font duy nhất cho toàn site công khai (BL-036); biến --font-montserrat được globals.css (@theme) trỏ vào --font-display / --font-sans.
export const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});
