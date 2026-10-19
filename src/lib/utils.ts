import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Mọi token cỡ chữ khai `--text-*` trong globals.css. twMerge không biết chúng là font-size nên mặc định
// coi `text-button`... là màu chữ và xoá nhầm khi đi cùng class màu. utils.test.ts đối chiếu với globals.css.
export const FONT_SIZE_TOKENS = [
  "display",
  "h1",
  "h2",
  "h2-sm",
  "h3",
  "h4",
  "lead",
  "body",
  "small",
  "xsmall",
  "eyebrow",
  "button",
  "button-sm",
  "price",
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: { radius: ["pill"] },
    classGroups: { "font-size": [{ text: FONT_SIZE_TOKENS }] },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
