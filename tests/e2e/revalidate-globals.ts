// G14: lưu global header/footer qua REST của app đang chạy (`next start`) thì trang công khai vi/en đổi ngay ở lần tải đầu
// (hook `revalidate-global` → `revalidateTag` thật, cache `unstable_cache` + ISR của layout). Không chạy trong `pnpm test`.
//
// Chạy (cần Postgres dev + app đã build):
//   pnpm build
//   pnpm start -p 3217            # terminal khác (hoặc chạy nền)
//   E2E_BASE_URL=http://127.0.0.1:3217 pnpm e2e:revalidate
//
// Script tạo một tài khoản admin tạm (email .test + mật khẩu ngẫu nhiên, chỉ trong DB dev), đổi header/footer, kiểm HTML,
// rồi KHÔNG để lại dữ liệu: khôi phục global về bản chụp ban đầu qua chính REST (kiểm luôn đường xoá) và xoá tài khoản tạm.
// Từ chối chạy ở production và khi E2E_BASE_URL không phải localhost/127.0.0.1 (staging công khai sau basic auth cũng không được đổi).
import { randomBytes } from "node:crypto";
import { getPayload } from "payload";

import config from "../../src/payload.config";

if (process.env.APP_ENV === "production") {
  console.error("Không chạy e2e revalidate ở production (APP_ENV=production).");
  process.exit(1);
}

type Locale = "vi" | "en";
const LOCALES: Locale[] = ["vi", "en"];
const PAGE_PATH: Record<Locale, string> = { vi: "/", en: "/en" };
const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3217";
if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/.test(baseUrl)) {
  console.error(`Từ chối chạy: E2E_BASE_URL (${baseUrl}) không phải localhost/127.0.0.1.`);
  process.exit(1);
}
const stamp = randomBytes(3).toString("hex");
const PAGE_KEYS = ["home", "projects", "rentals", "property-posts", "news", "careers", "contact"] as const;

const failures: string[] = [];
function check(condition: boolean, message: string) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${message}`);
  if (!condition) failures.push(message);
}

async function fetchPage(locale: Locale): Promise<string> {
  const response = await fetch(baseUrl + PAGE_PATH[locale], { redirect: "manual" });
  if (response.status !== 200) throw new Error(`${PAGE_PATH[locale]} trả ${response.status}`);
  return response.text();
}

const payload = await getPayload({ config });
const password = randomBytes(18).toString("base64url") + "aA1!";
const adminEmail = `e2e-revalidate-${stamp}@example.test`;
const admin = await payload.create({
  collection: "staff",
  overrideAccess: true,
  data: { email: adminEmail, password, fullName: "E2E revalidate", role: "admin", active: true },
});
const token = (await payload.login({ collection: "staff", data: { email: adminEmail, password } })).token ?? "";

async function saveGlobal(slug: "header" | "footer", locale: Locale, data: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}/api/globals/${slug}?locale=${locale}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Lưu ${slug}/${locale} lỗi ${response.status}: ${await response.text()}`);
  const body = (await response.json()) as { result: Record<string, { id?: string }[] | undefined> };
  return body.result;
}

async function snapshot(slug: "header" | "footer", locale: Locale) {
  return payload.findGlobal({ slug, locale, fallbackLocale: false, depth: 0, overrideAccess: true });
}

const originals = Object.fromEntries(
  await Promise.all(
    (["header", "footer"] as const).flatMap((slug) =>
      LOCALES.map(async (locale) => [`${slug}/${locale}`, await snapshot(slug, locale)] as const),
    ),
  ),
);

try {
  const label = (locale: Locale, name: string) => `E2E${stamp} ${locale.toUpperCase()} ${name}`;

  // ── Header: lưu bản vi, rồi bản en (dùng lại id dòng mảng), kiểm cả hai trang sau MỖI lần lưu.
  const viSaved = await saveGlobal("header", "vi", {
    navItems: PAGE_KEYS.map((key) => ({ label: label("vi", key), link: key })),
  });
  check((await fetchPage("vi")).includes(label("vi", "rentals")), "vi: nhãn header mới xuất hiện ở lần tải đầu sau khi lưu");
  const enBeforeSave = await fetchPage("en");
  check(!enBeforeSave.includes(`E2E${stamp}`), "en: chưa có bản EN thì KHÔNG hiện nhãn VI mới (dùng menu cố định en.json)");
  check(enBeforeSave.includes("Property news"), "en: menu cố định tiếng Anh vẫn hiển thị");

  const rows = viSaved.navItems ?? [];
  await saveGlobal("header", "en", {
    navItems: PAGE_KEYS.map((key, index) => ({ id: rows[index]?.id, label: label("en", key), link: key })),
  });
  const enHtml = await fetchPage("en");
  check(enHtml.includes(label("en", "rentals")), "en: nhãn header mới xuất hiện ở lần tải đầu sau khi lưu");
  check(enHtml.includes('href="/en/for-rent"'), "en: link giải theo ngôn ngữ (/en/for-rent)");

  // ── Footer.
  const footerBody = (locale: Locale) => ({
    columns: [{ title: label(locale, "col"), links: [{ label: label(locale, "link"), link: "news" }] }],
    copyright: label(locale, "copyright"),
  });
  const footerVi = await saveGlobal("footer", "vi", footerBody("vi"));
  check((await fetchPage("vi")).includes(label("vi", "copyright")), "vi: footer mới xuất hiện ở lần tải đầu sau khi lưu");
  const footerRows = footerVi.columns ?? [];
  await saveGlobal("footer", "en", {
    columns: [{ id: footerRows[0]?.id, ...footerBody("en").columns[0] }],
    copyright: footerBody("en").copyright,
  });
  const enAfterFooter = await fetchPage("en");
  check(enAfterFooter.includes(label("en", "copyright")), "en: footer mới xuất hiện ở lần tải đầu sau khi lưu");
  check(enAfterFooter.includes(label("en", "col")), "en: cột footer mới xuất hiện");
} finally {
  // Khôi phục qua REST (không chỉ Local API) để cache của app cũng về đúng bản gốc.
  for (const slug of ["header", "footer"] as const) {
    for (const locale of LOCALES) {
      const original = originals[`${slug}/${locale}`] as unknown as Record<string, unknown>;
      const fields =
        slug === "header"
          ? { navItems: original.navItems ?? [], ctaButton: original.ctaButton ?? {} }
          : { columns: original.columns ?? [], contactBlock: original.contactBlock ?? null, copyright: original.copyright ?? null };
      try {
        await saveGlobal(slug, locale, fields);
      } catch (error) {
        failures.push(`khôi phục ${slug}/${locale} lỗi: ${String(error)}`);
      }
    }
  }
  await payload.delete({ collection: "staff", id: admin.id, overrideAccess: true });
}

const viAfter = await fetchPage("vi");
const enAfter = await fetchPage("en");
check(!viAfter.includes(`E2E${stamp}`) && !enAfter.includes(`E2E${stamp}`), "sau khôi phục: không còn dữ liệu test trên cả hai trang");

await payload.destroy();
if (failures.length > 0) {
  console.error(`\n${failures.length} kiểm tra thất bại:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nG14 PASS: lưu global → trang vi/en đổi ở lần tải đầu.");
