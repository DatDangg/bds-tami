// Sinh ảnh minh hoạ mẫu cho dự án mẫu (`seed/sample/images/*.webp`): hình khối toà nhà vẽ bằng SVG rồi raster hoá bằng sharp.
// Tự tạo hoàn toàn, không dùng ảnh bên thứ ba (xem seed/sample/images/README.md). Chạy lại: `node scripts/generate-sample-images.mjs`.
// Kết quả xác định (không ngẫu nhiên) nên chạy lại cho file giống hệt.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const WIDTH = 1600;
const HEIGHT = 1000;
const outDir = fileURLToPath(new URL("../seed/sample/images/", import.meta.url));

/** Mỗi cảnh: dải màu bầu trời (trên → dưới), màu toà nhà, màu ô cửa. */
const SCENES = [
  { name: "can-ho-song-sai-gon", sky: ["#0f2a4a", "#e8b86a"], tower: "#14233a", glow: "#f6d58b", heights: [520, 640, 440, 700, 480], river: "#1d4e7a" },
  { name: "khu-do-thi-tay-ho", sky: ["#1f5f5b", "#f2e2b3"], tower: "#17403f", glow: "#fff1c7", heights: [360, 420, 300, 480, 340, 400], river: "#2a8c85" },
  { name: "biet-thu-ven-bien", sky: ["#2b6fa8", "#fbd9a6"], tower: "#3b4a5c", glow: "#fff4d6", heights: [240, 300, 220, 280], river: "#2f87c4" },
  { name: "can-ho-trung-tam", sky: ["#3a2a5c", "#f4a88a"], tower: "#241a3b", glow: "#ffd9a8", heights: [600, 460, 680, 520, 560], river: "#4a3b7a" },
  { name: "nha-pho-thuong-mai", sky: ["#5c3a1f", "#f8dca2"], tower: "#3b2a1a", glow: "#fff0cc", heights: [280, 340, 260, 320, 300, 360], river: "#7a5a33" },
  { name: "khu-do-thi-sinh-thai", sky: ["#2d5a2b", "#f0e6b0"], tower: "#1f3d1e", glow: "#fffbd0", heights: [320, 400, 360, 440, 300], river: "#3f8a3c" },
];

function buildSvg({ sky, tower, glow, heights, river }) {
  const base = 700;
  const slot = WIDTH / (heights.length + 1);
  const buildings = heights
    .map((height, index) => {
      const width = slot * 0.78;
      const x = slot * (index + 0.5) + (slot - width) / 2;
      const y = base - height;
      const windows = [];
      for (let row = 0; row < Math.floor(height / 60); row += 1) {
        for (let column = 0; column < 4; column += 1) {
          // Ô sáng xen kẽ theo công thức cố định để ảnh xác định.
          const lit = (row * 3 + column * 5 + index) % 3 !== 0;
          windows.push(
            `<rect x="${x + 18 + column * ((width - 36) / 4)}" y="${y + 24 + row * 60}" width="${(width - 36) / 4 - 12}" height="30" fill="${glow}" opacity="${lit ? 0.85 : 0.18}"/>`,
          );
        }
      }
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${tower}"/>${windows.join("")}`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${river}"/><stop offset="1" stop-color="${tower}"/></linearGradient></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
<circle cx="${WIDTH * 0.8}" cy="230" r="90" fill="${glow}" opacity="0.7"/>
${buildings}
<rect y="${base}" width="${WIDTH}" height="${HEIGHT - base}" fill="url(#water)"/>
</svg>`;
}

await mkdir(outDir, { recursive: true });
for (const scene of SCENES) {
  const buffer = await sharp(Buffer.from(buildSvg(scene))).webp({ quality: 70 }).toBuffer();
  await writeFile(`${outDir}${scene.name}.webp`, buffer);
  console.log(`${scene.name}.webp ${buffer.byteLength} bytes`);
}
