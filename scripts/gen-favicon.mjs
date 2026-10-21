// Sinh src/app/icon.png (tab: mái nhà vàng trên ô bo góc nền --color-dark) + src/app/apple-icon.png (180x180, nền kem --color-bg) từ logo vàng TAMI.
// Chạy: node scripts/gen-favicon.mjs (từ bất kỳ thư mục nào)
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const fromRoot = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const SOURCE = fromRoot("public/brand/tami-icon-gold.png");
const BG = "#f7f5f4"; // --color-bg trong src/app/(frontend)/globals.css
const DARK = "#111111"; // --color-dark: nền ô tab để vàng nhạt không chìm trên tab sáng
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

const trimmed = await sharp(SOURCE).extract({ left: 5, top: 66, width: 244, height: 121 }).toBuffer(); // bbox phần hình (alpha>8) đã đo; trim() không nhận nền trong suốt

// Tab icon 64px: ô vuông bo góc ~21%, mái nhà chiếm ~76% chiều ngang (lề 12%), góc ngoài bo trong suốt.
const TAB = 64;
const tile = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TAB}" height="${TAB}"><rect width="${TAB}" height="${TAB}" rx="13" fill="${DARK}"/></svg>`);
const tabInner = Math.round(TAB * 0.76);
const tabGlyph = await sharp(trimmed).resize(tabInner, tabInner, { fit: "contain", background: CLEAR }).toBuffer();
await sharp(tile).composite([{ input: tabGlyph, gravity: "center" }]).png().toFile(fromRoot("src/app/icon.png"));

// Apple icon: lề ~14% mỗi cạnh, nền đặc.
const inner = 180 - Math.round(180 * 0.28);
const glyph = await sharp(trimmed).resize(inner, inner, { fit: "contain", background: CLEAR }).toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 3, background: BG } })
  .composite([{ input: glyph, gravity: "center" }])
  .removeAlpha() // composite thêm kênh alpha; iOS cần ảnh đặc
  .png()
  .toFile(fromRoot("src/app/apple-icon.png"));
