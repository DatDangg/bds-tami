// Upload source map TRÌNH DUYỆT lên GlitchTip rồi xoá `.map` khỏi `.next/static` (không bao giờ phục vụ công khai).
// Chạy sau `next build` (docker/Dockerfile). Chỉ có việc phải làm khi đặt GLITCHTIP_AUTH_TOKEN: next.config.ts chỉ sinh
// source map trình duyệt khi có token này, nên không token = không có `.map` nào, script chỉ in "bỏ qua".
//   GLITCHTIP_AUTH_TOKEN  token API (quyền project:write); BÍ MẬT, chỉ qua env, không đưa vào tham số dòng lệnh
//   GLITCHTIP_URL         gốc GlitchTip, vd https://glitchtip.example.com
//   GLITCHTIP_ORG         slug organization
//   GLITCHTIP_PROJECT     slug project (cùng project với DSN trình duyệt)
// Mã hoá ngược stack bằng debug ID (sentry-cli `sourcemaps inject` gắn vào file .js + .map), không cần đặt tên release.
import SentryCli from "@sentry/cli";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const STATIC_DIR = ".next/static";
// Đường dẫn công khai của thư mục trên: Next phục vụ `.next/static/*` tại `/_next/static/*`.
const URL_PREFIX = "~/_next/static";

/**
 * Đọc cấu hình từ env. `null` = không có token (bỏ qua, build bình thường). Có token mà thiếu url/org/project là lỗi
 * cấu hình: ném lỗi để build dừng thay vì âm thầm không upload.
 * @param {Record<string, string | undefined>} env
 * @returns {{ authToken: string, url: string, org: string, project: string } | null}
 */
export function readUploadConfig(env) {
  const authToken = env.GLITCHTIP_AUTH_TOKEN?.trim();
  if (!authToken) return null;
  const url = env.GLITCHTIP_URL?.trim();
  const org = env.GLITCHTIP_ORG?.trim();
  const project = env.GLITCHTIP_PROJECT?.trim();
  const missing = [
    ["GLITCHTIP_URL", url],
    ["GLITCHTIP_ORG", org],
    ["GLITCHTIP_PROJECT", project],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) throw new Error(`Có GLITCHTIP_AUTH_TOKEN nhưng thiếu: ${missing.join(", ")}`);
  return { authToken, url, org, project };
}

/** Danh sách file `.map` dưới `dir` (đệ quy). */
export function listSourceMaps(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".map"))
    .map((entry) => join(entry.parentPath, entry.name));
}

function runCli(args, config) {
  // Token và url chỉ qua env của tiến trình con (không xuất hiện trong danh sách tham số / log lệnh).
  const env = {
    ...process.env,
    SENTRY_AUTH_TOKEN: config.authToken,
    SENTRY_URL: config.url,
    SENTRY_ORG: config.org,
    SENTRY_PROJECT: config.project,
  };
  execFileSync(SentryCli.getPath(), args, { stdio: "inherit", env });
}

function deleteSourceMaps(dir) {
  if (!existsSync(dir)) return;
  const maps = listSourceMaps(dir);
  for (const file of maps) rmSync(file);
  console.log(`[sourcemaps] đã xoá ${maps.length} file .map khỏi ${dir}`);
}

function main() {
  try {
    const config = readUploadConfig(process.env);
    if (!config) {
      console.log("[sourcemaps] không đặt GLITCHTIP_AUTH_TOKEN: bỏ qua upload");
      return;
    }
    runCli(["sourcemaps", "inject", STATIC_DIR], config);
    runCli(["sourcemaps", "upload", STATIC_DIR, "--url-prefix", URL_PREFIX], config);
  } finally {
    // Dù cấu hình sai hay upload lỗi cũng xoá: `.map` lộ ra công khai còn tệ hơn stack bị minify.
    deleteSourceMaps(STATIC_DIR);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
