import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Payload } from "payload";

import type { SeedResult } from "../categories";
import { paragraphsToLexical } from "../lexical";

const CATEGORY_APARTMENT = { vi: "Căn hộ chung cư", en: "Apartments" } as const;
const CATEGORY_URBAN = { vi: "Khu đô thị", en: "Urban areas" } as const;
const CATEGORY_VILLA = { vi: "Nhà phố, biệt thự", en: "Townhouses and villas" } as const;

/** Loại hình dự án mẫu. `seed/categories.ts` không tạo danh mục `project` mặc định (admin tự thêm), nên bước mẫu tự tạo nếu thiếu. */
export const SAMPLE_PROJECT_CATEGORY_NAME = CATEGORY_APARTMENT.vi;

interface SampleEnglish {
  title: string;
  summary: string;
}

interface SampleProject {
  title: string;
  summary: string;
  provinceSlug: string;
  address: string;
  salesStatus: "upcoming" | "selling" | "handed_over";
  location: readonly [number, number];
  priceFromVnd: number;
  priceToVnd: number;
  areaFromM2: number;
  areaToM2: number;
  category: { vi: string; en: string };
  /** Ảnh trong `seed/sample/images/` (ảnh tự tạo, xem README ở đó). */
  image: { file: string; alt: string; altEn: string };
  /** Có thì dự án có bản EN (`hasEnglish`), để kiểm tra `/en`. */
  english?: SampleEnglish;
}

/**
 * Dự án mẫu (FR-ADM-01, FR-PUB-02). Chỉ dữ liệu dev/staging: KHÔNG chạy ở production. Mỗi dự án có 1 ảnh trong thư viện ảnh
 * (bắt buộc để xuất bản) nên được `published`: đủ để dựng danh sách/lọc theo loại hình, tỉnh, trạng thái mở bán và `/en`.
 * `provinceSlug` là slug tỉnh do `pnpm seed` nạp.
 */
export const SAMPLE_PROJECTS: readonly SampleProject[] = [
  {
    title: "Dự án mẫu Căn hộ Sông Sài Gòn",
    summary: "Căn hộ cao cấp ven sông, gần trung tâm, tiện ích đầy đủ.",
    provinceSlug: "ho-chi-minh",
    address: "Quận 1, TP. Hồ Chí Minh",
    salesStatus: "selling",
    location: [106.7009, 10.7769],
    priceFromVnd: 3_500_000_000,
    priceToVnd: 8_000_000_000,
    areaFromM2: 50,
    areaToM2: 120,
    category: CATEGORY_APARTMENT,
    image: { file: "can-ho-song-sai-gon.webp", alt: "Ảnh minh hoạ các toà căn hộ ven sông lúc hoàng hôn", altEn: "Illustration of riverside apartment towers at sunset" },
    english: { title: "Sample Saigon Riverside Apartments", summary: "Premium riverside apartments near the city centre with full amenities." },
  },
  {
    title: "Dự án mẫu Khu đô thị Tây Hồ",
    summary: "Khu đô thị xanh quanh hồ, phù hợp ở và đầu tư.",
    provinceSlug: "ha-noi",
    address: "Tây Hồ, Hà Nội",
    salesStatus: "upcoming",
    location: [105.8194, 21.0586],
    priceFromVnd: 4_200_000_000,
    priceToVnd: 9_500_000_000,
    areaFromM2: 60,
    areaToM2: 150,
    category: CATEGORY_URBAN,
    image: { file: "khu-do-thi-tay-ho.webp", alt: "Ảnh minh hoạ khu đô thị xanh bên hồ", altEn: "Illustration of a green urban area by a lake" },
    english: { title: "Sample West Lake Urban Area", summary: "A green lakeside urban area for living and investing." },
  },
  {
    title: "Dự án mẫu Biệt thự ven biển Đà Nẵng",
    summary: "Biệt thự nghỉ dưỡng sát biển, thiết kế mở đón gió.",
    provinceSlug: "da-nang",
    address: "Ngũ Hành Sơn, Đà Nẵng",
    salesStatus: "selling",
    location: [108.2603, 16.0036],
    priceFromVnd: 12_000_000_000,
    priceToVnd: 30_000_000_000,
    areaFromM2: 200,
    areaToM2: 450,
    category: CATEGORY_VILLA,
    image: { file: "biet-thu-ven-bien.webp", alt: "Ảnh minh hoạ dãy biệt thự thấp tầng ven biển", altEn: "Illustration of a row of low-rise seaside villas" },
  },
  {
    title: "Dự án mẫu Căn hộ Trung Tâm Hà Nội",
    summary: "Căn hộ đã bàn giao, vận hành ổn định, giao thông thuận tiện.",
    provinceSlug: "ha-noi",
    address: "Cầu Giấy, Hà Nội",
    salesStatus: "handed_over",
    location: [105.7938, 21.0333],
    priceFromVnd: 3_000_000_000,
    priceToVnd: 6_500_000_000,
    areaFromM2: 45,
    areaToM2: 110,
    category: CATEGORY_APARTMENT,
    image: { file: "can-ho-trung-tam.webp", alt: "Ảnh minh hoạ cụm căn hộ cao tầng giữa trung tâm", altEn: "Illustration of high-rise apartments in the city centre" },
    english: { title: "Sample Hanoi Central Apartments", summary: "Handed-over apartments in stable operation with convenient transport." },
  },
  {
    title: "Dự án mẫu Nhà phố thương mại Thủ Đức",
    summary: "Nhà phố thương mại mặt tiền, sẵn kinh doanh.",
    provinceSlug: "ho-chi-minh",
    address: "Thủ Đức, TP. Hồ Chí Minh",
    salesStatus: "upcoming",
    location: [106.7717, 10.8494],
    priceFromVnd: 9_000_000_000,
    priceToVnd: 18_000_000_000,
    areaFromM2: 80,
    areaToM2: 160,
    category: CATEGORY_VILLA,
    image: { file: "nha-pho-thuong-mai.webp", alt: "Ảnh minh hoạ dãy nhà phố thương mại", altEn: "Illustration of a row of commercial townhouses" },
  },
  {
    title: "Dự án mẫu Khu đô thị sinh thái Hải Phòng",
    summary: "Khu đô thị sinh thái nhiều cây xanh, đã bàn giao giai đoạn một.",
    provinceSlug: "hai-phong",
    address: "Thuỷ Nguyên, Hải Phòng",
    salesStatus: "handed_over",
    location: [106.6881, 20.8449],
    priceFromVnd: 2_500_000_000,
    priceToVnd: 7_000_000_000,
    areaFromM2: 70,
    areaToM2: 180,
    category: CATEGORY_URBAN,
    image: { file: "khu-do-thi-sinh-thai.webp", alt: "Ảnh minh hoạ khu đô thị sinh thái nhiều cây xanh", altEn: "Illustration of an eco urban area with lots of greenery" },
  },
];

const options = { depth: 0, limit: 1, pagination: false, overrideAccess: true } as const;

/** Danh mục `project` theo tên `vi` (kể cả đã xoá mềm); chưa có thì tạo, thêm bản EN và bật `hasEnglish` nếu có tên EN. */
async function findOrCreateProjectCategory(payload: Payload, name: { vi: string; en: string }): Promise<string> {
  const found = await payload.find({
    collection: "categories",
    where: { and: [{ scope: { equals: "project" } }, { name: { equals: name.vi } }] },
    locale: "vi",
    fallbackLocale: false,
    trash: true,
    ...options,
  });
  const existing = found.docs[0];
  const id =
    existing?.id ??
    (await payload.create({ collection: "categories", data: { name: name.vi, scope: "project" } as never, locale: "vi", depth: 0, overrideAccess: true })).id;
  // Danh mục có sẵn từ seed cũ chưa có bản EN: bổ sung để `/en` có chip loại hình.
  if (!existing || existing.hasEnglish !== true) {
    await payload.update({ collection: "categories", id, data: { name: name.en, hasEnglish: true } as never, locale: "en", depth: 0, overrideAccess: true });
  }
  return id;
}

async function findProvinceId(payload: Payload, slug: string): Promise<string> {
  const province = (await payload.find({ collection: "provinces", where: { slug: { equals: slug } }, ...options })).docs[0];
  if (!province) throw new Error(`Thiếu tỉnh/thành "${slug}": chạy pnpm seed (địa giới) trước.`);
  return province.id;
}

/**
 * Ảnh mẫu trong `media`, idempotent theo `alt` `vi`: có rồi thì dùng lại, chưa có thì đọc file trong repo và upload bằng Local API
 * (không tải mạng). Tên file trên S3 là UUID ngẫu nhiên nên không dùng tên file để nhận diện.
 */
async function findOrUploadImage(payload: Payload, image: SampleProject["image"], englishAlt: string | undefined): Promise<string> {
  const found = await payload.find({ collection: "media", where: { alt: { equals: image.alt } }, locale: "vi", fallbackLocale: false, ...options });
  if (found.docs[0]) return found.docs[0].id;
  const data = await readFile(fileURLToPath(new URL(`./images/${image.file}`, import.meta.url)));
  const created = await payload.create({
    collection: "media",
    data: { alt: image.alt },
    file: { data, mimetype: "image/webp", name: image.file, size: data.byteLength },
    locale: "vi",
    depth: 0,
    overrideAccess: true,
  });
  if (englishAlt) {
    await payload.update({ collection: "media", id: created.id, data: { alt: englishAlt }, locale: "en", depth: 0, overrideAccess: true });
  }
  return created.id;
}

async function addEnglish(payload: Payload, id: string, english: SampleEnglish): Promise<void> {
  await payload.update({
    collection: "projects",
    id,
    data: {
      title: english.title,
      summary: english.summary,
      overview: paragraphsToLexical([english.summary]) as never,
      hasEnglish: true,
    } as never,
    locale: "en",
    depth: 0,
    overrideAccess: true,
  });
}

async function createProject(payload: Payload, sample: SampleProject, authorId: string): Promise<void> {
  const { title, summary, provinceSlug, category, image, english, location, ...rest } = sample;
  // Tỉnh trước: thiếu tỉnh thì ném lỗi trước khi tạo danh mục/ảnh (không để lại dữ liệu mồ côi).
  const province = await findProvinceId(payload, provinceSlug);
  const [categoryId, imageId] = await Promise.all([
    findOrCreateProjectCategory(payload, category),
    findOrUploadImage(payload, image, english ? image.altEn : undefined),
  ]);
  const created = await payload.create({
    collection: "projects",
    data: {
      ...rest,
      location: [...location],
      title,
      summary,
      overview: paragraphsToLexical([summary]) as never,
      category: categoryId,
      province,
      author: authorId,
      gallery: [imageId],
      status: "published",
    },
    locale: "vi",
    overrideAccess: true,
  });
  if (english) await addEnglish(payload, created.id, english);
}

/**
 * Dự án mẫu bản nháp không ảnh từ lần seed cũ (trước L6-T04): bổ sung ảnh rồi xuất bản, để chạy lại seed trên DB đã có không
 * để lại bản nháp. Dự án đã có ảnh hoặc không còn là nháp (sale/admin đã chỉnh) thì giữ nguyên.
 */
async function completeLegacyDraft(
  payload: Payload,
  sample: SampleProject,
  existing: { id: string; status?: string | null; gallery?: unknown[] | null; hasEnglish?: boolean | null },
): Promise<void> {
  if (existing.status !== "draft" || (existing.gallery?.length ?? 0) > 0) return;
  const [imageId, categoryId] = await Promise.all([
    findOrUploadImage(payload, sample.image, sample.english ? sample.image.altEn : undefined),
    findOrCreateProjectCategory(payload, sample.category),
  ]);
  await payload.update({
    collection: "projects",
    id: existing.id,
    data: { gallery: [imageId], category: categoryId, status: "published" },
    locale: "vi",
    depth: 0,
    overrideAccess: true,
  });
  if (sample.english && existing.hasEnglish !== true) await addEnglish(payload, existing.id, sample.english);
}

/**
 * Tạo dự án mẫu (bản `vi`, `published`, có ảnh), idempotent theo tiêu đề `vi` (kể cả bản đã xoá mềm); chạy lại không nhân đôi dự án
 * lẫn ảnh. Cần địa giới (`pnpm seed`) và ít nhất một admin để làm tác giả; thiếu thì ném lỗi rõ ràng thay vì tạo dữ liệu dở.
 */
export async function seedSampleProjects(payload: Payload): Promise<SeedResult> {
  const author = (await payload.find({ collection: "staff", where: { role: { equals: "admin" } }, ...options })).docs[0];
  if (!author) throw new Error("Chưa có tài khoản admin để làm tác giả dự án mẫu: tạo admin trước.");

  const result: SeedResult = { created: 0, skipped: 0 };
  for (const sample of SAMPLE_PROJECTS) {
    const found = await payload.find({
      collection: "projects",
      where: { title: { equals: sample.title } },
      locale: "vi",
      fallbackLocale: false,
      trash: true,
      ...options,
    });
    const existing = found.docs[0];
    if (!existing) {
      await createProject(payload, sample, author.id);
      result.created += 1;
      continue;
    }
    // Bản nháp cũ được hoàn thiện (không tạo mới) nên tính là đã có.
    await completeLegacyDraft(payload, sample, existing as never);
    result.skipped += 1;
  }
  return result;
}
