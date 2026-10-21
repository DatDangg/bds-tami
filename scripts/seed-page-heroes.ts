// Seed DEV cho BL-045: chữ hero vi/en 6 trang con, dải ý Tuyển dụng (4 mục vi/en), ảnh banner Liên hệ + Pháp lý,
// xuất bản 2 trang pháp lý mẫu. Chạy: `pnpm seed:page-heroes` (= `payload run scripts/seed-page-heroes.ts`).
// Idempotent (ghi đè đúng các trường này, ảnh dò theo `alt`); từ chối khi NODE_ENV=production hoặc DATABASE_URL trùng staging/prod (`checkSeedEnvironment`); không xếp job dịch AI.
// BL-047: `seedHomeAbout` GHI ĐÈ khối Về TAMI trang chủ (ảnh phụ, ảnh trang trí, nội dung vi/en, chú thích, icon số liệu) của DB dev; cần thư mục ảnh `seed/scraped*` (gitignore), thiếu thì báo lỗi rõ.
// Xuất bản CHỈ 2 trang pháp lý (`kind` privacy/terms) và 3 dịch vụ mẫu của `seed:sample-services` (theo slug), không đụng bản nháp khác.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPayload, type Payload } from "payload";

import config from "../src/payload.config";
import { TRANSLATION_JOB_CONTEXT_KEY } from "../src/hooks/translation/translation-targets";

import { checkSeedEnvironment } from "../src/lib/rentals/sample-amenities";

const guard = checkSeedEnvironment(process.env);
if (!guard.allowed) {
  console.error(`seed:page-heroes từ chối chạy: ${guard.reason}. Script này chỉ dành cho DB dev.`);
  process.exit(1);
}

const context = () => ({ [TRANSLATION_JOB_CONTEXT_KEY]: true });
const Q = { depth: 0, limit: 1, pagination: false, overrideAccess: true } as const;
const MOCKUP_ASSETS = path.resolve(process.cwd(), "docs/specs/site-redesign-mockup/assets");

interface HeroText {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
}
const HEROES: Record<string, { vi: HeroText; en: HeroText }> = {
  projects: {
    vi: { eyebrow: "Dự án TAMI HOMES", title: "Dự án đang", titleAccent: "phân phối", description: "Các dự án bất động sản TAMI phân phối, lọc theo loại hình, tỉnh/thành và tình trạng mở bán." },
    en: { eyebrow: "TAMI HOMES projects", title: "Projects now", titleAccent: "on offer", description: "Real estate projects distributed by TAMI, filtered by type, province and sales status." },
  },
  rentals: {
    vi: { eyebrow: "Cho thuê", title: "Căn hộ cho thuê", titleAccent: "sẵn sàng vào ở", description: "Căn hộ, nhà phố, văn phòng cho thuê do TAMI tư vấn: lọc theo khu vực, mức giá, diện tích và nội thất." },
    en: { eyebrow: "For rent", title: "Apartments for rent", titleAccent: "ready to move in", description: "Apartments, townhouses and offices for rent, advised by TAMI: filter by area, price, size and furnishing." },
  },
  news: {
    vi: { eyebrow: "Tin tức", title: "Tin tức &", titleAccent: "góc nhìn thị trường", description: "Cập nhật từ TAMI HOMES và thị trường bất động sản." },
    en: { eyebrow: "News", title: "News &", titleAccent: "market insights", description: "Updates from TAMI HOMES and the real estate market." },
  },
  propertyPosts: {
    vi: { eyebrow: "Đăng tin BĐS", title: "Bất động sản", titleAccent: "đang chào bán", description: "Tin bán nhà đất, căn hộ do TAMI tuyển chọn, cập nhật liên tục." },
    en: { eyebrow: "Property listings", title: "Properties", titleAccent: "for sale", description: "Houses, land and apartments for sale selected by TAMI, updated continuously." },
  },
  careers: {
    vi: { eyebrow: "Tuyển dụng", title: "Gia nhập", titleAccent: "TAMI HOMES", description: "Cùng xây dựng trải nghiệm an cư tốt hơn cho khách hàng." },
    en: { eyebrow: "Careers", title: "Join", titleAccent: "TAMI HOMES", description: "Help us build a better home-finding experience for our clients." },
  },
  contact: {
    vi: { eyebrow: "Liên hệ", title: "Kết nối với", titleAccent: "TAMI HOMES", description: "Để lại thông tin, chúng tôi liên hệ trong thời gian sớm nhất." },
    en: { eyebrow: "Contact", title: "Get in touch with", titleAccent: "TAMI HOMES", description: "Leave your details and we will get back to you shortly." },
  },
};

const PERKS = [
  { icon: "star", vi: ["Thu nhập hấp dẫn", "Lương + hoa hồng rõ ràng"], en: ["Attractive income", "Clear salary plus commission"] },
  { icon: "users", vi: ["Đội ngũ trẻ", "Hỗ trợ, chia sẻ"], en: ["A young team", "Supportive and open"] },
  { icon: "buildings", vi: ["Nguồn hàng lớn", "Dự án và căn cho thuê"], en: ["Large inventory", "Projects and rentals"] },
  { icon: "shield-check", vi: ["Đào tạo bài bản", "Lộ trình thăng tiến"], en: ["Structured training", "A clear growth path"] },
] as const;

type ImageExtract = { left: number; top: number; width: number; height: number };

/** Đưa một ảnh webp vào media, dò theo `alt` (idempotent); `extract` cắt vùng trước khi lưu (ảnh trang trí dọc). */
async function uploadImage(payload: Payload, root: string, file: string, alt: string, extract?: ImageExtract): Promise<string> {
  const found = await payload.find({ collection: "media", where: { alt: { equals: alt } }, locale: "vi", fallbackLocale: false, ...Q });
  if (found.docs[0]) return found.docs[0].id as string;
  let data = await readFile(path.join(root, file));
  if (extract) {
    const sharp = (await import("sharp")).default;
    data = await sharp(data).extract(extract).webp({ quality: 82 }).toBuffer();
  }
  const created = await payload.create({
    collection: "media",
    data: { alt },
    file: { data, mimetype: "image/webp", name: path.basename(file), size: data.byteLength },
    locale: "vi",
    depth: 0,
    overrideAccess: true,
    context: context(),
  });
  return created.id as string;
}

const uploadMockupImage = (payload: Payload, file: string, alt: string) => uploadImage(payload, MOCKUP_ASSETS, file, alt);

async function seedSettings(payload: Payload) {
  const contact = await uploadMockupImage(payload, "img1.webp", "Banner trang Liên hệ (mẫu dev)");
  const legal = await uploadMockupImage(payload, "img2.webp", "Banner trang Pháp lý (mẫu dev)");
  const heroes = (lang: "vi" | "en") => Object.fromEntries(Object.entries(HEROES).map(([key, texts]) => [key, texts[lang]]));
  const common = { depth: 0, overrideAccess: true, context: context() } as const;

  await payload.updateGlobal({
    slug: "site-settings",
    locale: "vi",
    data: {
      pageBanners: { contact, legal },
      pageHeroes: heroes("vi"),
      showProjectStrengths: true,
      careersPerks: PERKS.map((p) => ({ icon: p.icon, title: p.vi[0], description: p.vi[1] })),
    } as never,
    ...common,
  });
  // Mục mảng đã có `id` sau lần ghi vi; bản en ghi lại đúng các id đó để không sinh dòng mới.
  const saved = (await payload.findGlobal({ slug: "site-settings", locale: "vi", depth: 0, overrideAccess: true })) as unknown as {
    careersPerks: { id: string }[];
    siteName?: string;
  };
  // `siteName` bắt buộc theo từng ngôn ngữ: bản en chưa có thì mượn tạm chữ vi để lần ghi không bị từ chối.
  const savedEn = (await payload.findGlobal({ slug: "site-settings", locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true })) as unknown as { siteName?: string };
  await payload.updateGlobal({
    slug: "site-settings",
    locale: "en",
    data: {
      ...(savedEn.siteName ? {} : { siteName: saved.siteName }),
      pageHeroes: heroes("en"),
      careersPerks: saved.careersPerks.map((row, i) => ({ id: row.id, icon: PERKS[i].icon, title: PERKS[i].en[0], description: PERKS[i].en[1] })),
    } as never,
    ...common,
  });
}

const SCRAPED = path.resolve(process.cwd(), "seed");
const ABOUT_SECONDARY_FILE = "scraped/images/c6c00bbf03a0f703.webp";
const ABOUT_DECOR_FILE = "scraped-extra/images/71246155afaf2609.webp";

/** BL-047 — khối Về TAMI trang chủ theo mockup: ảnh phụ nội thất, ảnh toà nhà trang trí mép phải, chữ giới thiệu + chú thích + icon số liệu. */
async function seedHomeAbout(payload: Payload) {
  // Kiểm nguồn ảnh TRƯỚC khi ghi gì để không bỏ dở giữa chừng.
  const missing = [ABOUT_SECONDARY_FILE, ABOUT_DECOR_FILE].filter((file) => !existsSync(path.join(SCRAPED, file)));
  if (missing.length > 0) throw new Error(`seedHomeAbout: thiếu ảnh nguồn (gitignore, lấy từ máy có thư mục seed/scraped*): ${missing.join(", ")}`);
  const secondaryImage = await uploadImage(payload, SCRAPED, ABOUT_SECONDARY_FILE, "Phòng khách căn hộ nhìn ra thành phố (mẫu dev)");
  const decorImage = await uploadImage(payload, SCRAPED, ABOUT_DECOR_FILE, "Toà tháp xanh trang trí Về TAMI (mẫu dev)", { left: 640, top: 0, width: 760, height: 1080 });
  const { paragraphsToLexical } = await import("../seed/lexical");
  const home = (await payload.findGlobal({ slug: "homepage", locale: "vi", depth: 0, overrideAccess: true })) as unknown as {
    about?: { stats?: { id: string; value: string; label: string; icon?: string | null }[] };
  };
  const stats = home.about?.stats ?? [];
  const icons = ["medal", "users-three"];
  const common = { depth: 0, overrideAccess: true, context: context() } as const;
  await payload.updateGlobal({
    slug: "homepage",
    locale: "vi",
    data: {
      about: {
        secondaryImage,
        decorImage,
        content: paragraphsToLexical(["TAMI HOMES là đơn vị phân phối, môi giới và khai thác căn hộ dịch vụ, mang đến giải pháp an cư tiện nghi, hiện đại cho khách hàng."]),
        imageCaption: "Không gian sống\nhiện đại\nTiện nghi\nSẵn sàng vào ở",
        stats: stats.map((row, i) => ({ ...row, icon: icons[i] ?? row.icon })),
      },
    } as never,
    ...common,
  });
  await payload.updateGlobal({
    slug: "homepage",
    locale: "en",
    data: {
      about: {
        content: paragraphsToLexical(["TAMI HOMES distributes, brokers and operates serviced apartments, bringing clients comfortable, modern places to live."]),
        imageCaption: "Modern\nliving spaces\nFully equipped\nReady to move in",
      },
    } as never,
    ...common,
  });
}

/** Dev: xuất bản đúng 2 trang pháp lý mẫu (`kind` privacy/terms) nếu còn nháp để trang Pháp lý xem được. */
async function publishLegalPages(payload: Payload) {
  const pages = await payload.find({ collection: "pages", where: { kind: { in: ["privacy", "terms"] } }, depth: 0, limit: 10, pagination: false, overrideAccess: true, locale: "vi", draft: false });
  for (const page of pages.docs as unknown as { id: string; status: string; title: string }[]) {
    if (page.status === "published") continue;
    await payload.update({ collection: "pages", id: page.id, data: { status: "published" } as never, locale: "vi", depth: 0, overrideAccess: true, context: context() });
    payload.logger.info(`Đã xuất bản trang pháp lý: ${page.title}`);
  }
}

/** Slug 3 dịch vụ do `seed:sample-services` tạo (mặc định nháp). */
const SAMPLE_SERVICE_SLUGS = ["phan-phoi", "moi-gioi", "khai-thac-can-ho-dich-vu"];

/** Dev: xuất bản đúng 3 dịch vụ mẫu đó để trang Dịch vụ xem được. */
async function publishSampleServices(payload: Payload) {
  const services = await payload.find({ collection: "services", where: { slug: { in: SAMPLE_SERVICE_SLUGS } }, depth: 0, limit: 20, pagination: false, overrideAccess: true, locale: "vi" });
  const covers = ["img3.webp", "img4.webp", "img5.webp"];
  for (const [index, service] of (services.docs as unknown as { id: string; status: string; title: string; coverImage?: unknown }[]).entries()) {
    if (service.status === "published") continue;
    const coverImage = service.coverImage ?? (await uploadMockupImage(payload, covers[index % covers.length], `Ảnh bìa dịch vụ mẫu ${index + 1} (mẫu dev)`));
    await payload.update({ collection: "services", id: service.id, data: { status: "published", coverImage } as never, locale: "vi", depth: 0, overrideAccess: true, context: context() });
    payload.logger.info(`Đã xuất bản dịch vụ mẫu: ${service.title}`);
  }
}

const payload = await getPayload({ config });
try {
  await seedSettings(payload);
  await publishLegalPages(payload);
  await publishSampleServices(payload);
  await seedHomeAbout(payload);
  payload.logger.info("Seed page-heroes xong: chữ hero vi/en, careersPerks, ảnh banner Liên hệ + Pháp lý, khối Về TAMI trang chủ.");
} finally {
  await payload.destroy();
}
