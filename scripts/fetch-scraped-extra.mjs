// Tải thêm ảnh gallery cho dự án từ trang bài viết dự án của bdstanlong.vn (HTML đã cào sẵn ở seed/scraped-cache)
// vào seed/scraped-extra/ (gitignore). Chỉ dev, chỉ nhận ảnh (kiểm magic bytes), tối đa MAX_TOTAL ảnh, ≤ MAX_BYTES/ảnh,
// chuyển webp bằng sharp. Ghi nguồn từng ảnh vào seed/scraped-extra/manifest.json. Chạy lại: bỏ qua ảnh đã tải.
// Chạy: node scripts/fetch-scraped-extra.mjs
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "seed/scraped-extra");
const ORIGIN = "https://bdstanlong.vn";
const MAX_TOTAL = 150;
const MAX_BYTES = 1_500_000;
const PROJECTS_WITH_GALLERY = 28;
const EXTRAS_PER_PROJECT = 5;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_HOST = new URL(ORIGIN).hostname;
const SKIP_NAME = /bang-gia|chinh-sach|thanh-toan|logo|banner-up|qr|so-do|phap-ly/i;

if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") throw new Error("Không chạy ở production.");
mkdirSync(path.join(OUT, "images"), { recursive: true });
const manifestPath = path.join(OUT, "manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { images: [] };
const bundle = JSON.parse(readFileSync(path.join(ROOT, "seed/scraped/data.json"), "utf8"));

function candidates(project) {
  const file = path.join(ROOT, "seed/scraped-cache", `${createHash("sha1").update(project.sourceUrl).digest("hex")}.html`);
  if (!existsSync(file)) return [];
  const html = readFileSync(file, "utf8");
  const cut = html.search(/aspect-ratio: 4 \/ 3/); // sau mốc này là thẻ "dự án liên quan"
  const body = cut > 0 ? html.slice(0, cut) : html;
  const urls = [...body.matchAll(/<img[^>]+src=["'](\/images\/news\/[^"']+)/g)].map((m) => m[1]).filter((u) => !SKIP_NAME.test(u));
  const unique = [...new Set(urls)];
  return [...unique.filter((u) => /\.jpe?g$/i.test(u)), ...unique.filter((u) => !/\.jpe?g$/i.test(u))];
}

const ranked = bundle.projects
  .map((p, index) => ({ p, index, list: candidates(p) }))
  .filter((x) => x.list.length >= EXTRAS_PER_PROJECT)
  .sort((a, b) => (a.index < 8 ? -1 : 0) - (b.index < 8 ? -1 : 0) || b.list.length - a.list.length)
  .slice(0, PROJECTS_WITH_GALLERY);

const isImage = (b) =>
  (b[0] === 0xff && b[1] === 0xd8) || (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e) || (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP");

/** URL tuyệt đối trên đúng host nguồn; đường dẫn lỗi mã hoá (decodeURI ném) thì bỏ. */
function safeUrl(rel) {
  try {
    const url = new URL(encodeURI(decodeURI(rel)), ORIGIN);
    return url.hostname === ALLOWED_HOST ? url.href : null;
  } catch {
    return null;
  }
}

/** Tải có timeout, không theo redirect sang host khác, dừng khi vượt MAX_DOWNLOAD_BYTES (kiểm content-length rồi đếm khi đọc stream). */
async function download(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: "manual" });
    if (!res.ok || !res.body) return null;
    if (Number(res.headers.get("content-length") ?? 0) > MAX_DOWNLOAD_BYTES) return null;
    const chunks = [];
    let total = 0;
    for await (const chunk of res.body) {
      total += chunk.byteLength;
      if (total > MAX_DOWNLOAD_BYTES) return null;
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

for (const { p, list } of ranked) {
  let got = manifest.images.filter((m) => m.project === p.title).length;
  for (const rel of list) {
    if (got >= EXTRAS_PER_PROJECT || manifest.images.length >= MAX_TOTAL) break;
    const sourceUrl = safeUrl(rel);
    if (!sourceUrl || manifest.images.some((m) => m.sourceUrl === sourceUrl)) continue;
    const buf = await download(sourceUrl);
    if (!buf || !isImage(buf)) continue;
    let out = await sharp(buf).rotate().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    if (out.byteLength > MAX_BYTES) out = await sharp(buf).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
    if (out.byteLength > MAX_BYTES) continue;
    const meta = await sharp(out).metadata();
    if ((meta.width ?? 0) < 600) continue;
    const file = `${createHash("sha1").update(sourceUrl).digest("hex").slice(0, 16)}.webp`;
    writeFileSync(path.join(OUT, "images", file), out);
    manifest.images.push({ file, project: p.title, sourceUrl, width: meta.width, height: meta.height });
    got += 1;
  }
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Ảnh thêm: ${manifest.images.length}/${MAX_TOTAL}, dự án: ${new Set(manifest.images.map((m) => m.project)).size}`);
